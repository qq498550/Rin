import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Loading from 'react-loading';
import { FlatInset, FlatTabButton } from "@rin/ui";
import { useAlert } from "./dialog";
import { useColorMode } from "../utils/darkModeUtils";
import { buildMarkdownImage, isImageFile, uploadImageWithCompression, uploadImagesBatch } from "../utils/image-upload";
import { Markdown } from "./markdown";


interface MarkdownEditorProps {
  content: string;
  setContent: (content: string) => void;
  placeholder?: string;
  height?: string;
}

export function MarkdownEditor({ content, setContent, placeholder = "> Write your content here...", height = "400px" }: MarkdownEditorProps) {
  const { t } = useTranslation();
  const colorMode = useColorMode();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const isComposingRef = useRef(false);
  const [preview, setPreview] = useState<'edit' | 'preview' | 'comparison'>('edit');
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const { showAlert, AlertUI } = useAlert();
  const uploading = uploadProgress !== null;

  async function insertImages(
    files: File[],
    range: NonNullable<ReturnType<editor.IStandaloneCodeEditor["getSelection"]>>,
    showAlert: (msg: string) => void,
  ) {
    if (files.length === 0) return;

    try {
      if (files.length === 1) {
        setUploadProgress({ done: 0, total: 1 });
        const result = await uploadImageWithCompression(files[0], { variant: "content" });
        const editorInstance = editorRef.current;
        if (!editorInstance) return;
        editorInstance.executeEdits(undefined, [{
          range,
          text: buildMarkdownImage(files[0].name, result.url, {
            blurhash: result.blurhash,
            width: result.width,
            height: result.height,
          }),
        }]);
        return;
      }

      setUploadProgress({ done: 0, total: files.length });
      const results = await uploadImagesBatch(files, {
        variant: "content",
        onProgress: ({ completed, total }) => {
          setUploadProgress({ done: completed, total });
        },
      });

      const markdownText = results
        .filter((result) => result.status === "success")
        .map((result) =>
          buildMarkdownImage(result.file.name, result.url ?? "", {
            blurhash: result.blurhash,
            width: result.width,
            height: result.height,
          }),
        )
        .join("");

      if (markdownText) {
        const editorInstance = editorRef.current;
        if (!editorInstance) return;
        editorInstance.executeEdits(undefined, [{ range, text: markdownText }]);
      }

      const failedItems = results.filter((result) => result.status !== "success");
      if (failedItems.length > 0) {
        showAlert(t("upload.batch_failed$names", {
          names: failedItems.map((item) => item.file.name).join(", "),
        }));
      }
    } catch (error) {
      console.error(error);
      showAlert(error instanceof Error ? error.message : t("upload.failed"));
    }
  }

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = event.clipboardData;
    const files = Array.from(clipboardData.files).filter(isImageFile);
    if (files.length > 0) {
      const editor = editorRef.current;
      if (!editor) return;
      editor.trigger(undefined, "undo", undefined);
      const selection = editor.getSelection();
      if (!selection) {
        return;
      }
      void insertImages(files, selection, showAlert).finally(() => {
        setUploadProgress(null);
      });
    }
  };

  function UploadImageButton() {
    const uploadRef = useRef<HTMLInputElement>(null);

    const upChange = (event: any) => {
      const files = Array.from(event.currentTarget.files as FileList).filter(isImageFile);
      if (files.length === 0) return;
      const editor = editorRef.current;
      if (!editor) return;
      const selection = editor.getSelection();
      if (!selection) return;
      void insertImages(files, selection, showAlert).finally(() => {
        setUploadProgress(null);
      });
    };

    return (
      <button
        type="button"
        onClick={() => uploadRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-w px-3 py-2 text-sm t-primary transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
      >
        <input
          ref={uploadRef}
          onChange={upChange}
          className="hidden"
          type="file"
          accept="image/gif,image/jpeg,image/jpg,image/png,image/webp,image/avif"
          multiple
        />
        <i className="ri-image-add-line" />
        <span>Image</span>
      </button>
    );
  }

  /* ---------------- Monaco Mount & IME Optimization ---------------- */

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    editor.onDidCompositionStart(() => {
      isComposingRef.current = true;
    });

    editor.onDidCompositionEnd(() => {
      isComposingRef.current = false;
      setContent(editor.getValue());
    });

    editor.onDidChangeModelContent(() => {
      if (!isComposingRef.current) {
        setContent(editor.getValue());
      }
    });

    editor.onDidBlurEditorText(() => {
      setContent(editor.getValue());
    });
  };

  /* ---------------- synchronization ---------------- */

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const editorValue = model.getValue();

    // Avoid infinite loops & prevent overwriting content being edited
    if (editorValue !== content) {
      editor.setValue(content);
    }
  }, [content]);

  /* ---------------- UI ---------------- */

  return (
    <div className="flex flex-col gap-0 sm:gap-3">
      <FlatInset className="flex flex-wrap items-center gap-2 border-0 border-b border-black/10 rounded-none bg-transparent p-3 dark:border-white/10">
        <FlatTabButton active={preview === 'edit'} onClick={() => setPreview('edit')}> {t("edit")} </FlatTabButton>
        <FlatTabButton active={preview === 'preview'} onClick={() => setPreview('preview')}> {t("preview")} </FlatTabButton>
        <FlatTabButton active={preview === 'comparison'} onClick={() => setPreview('comparison')}> {t("comparison")} </FlatTabButton>
        <div className="flex-grow" />
        <UploadImageButton />
        {uploading &&
          <div className="flex flex-row items-center space-x-2">
            <Loading type="spin" color="#FC466B" height={16} width={16} />
            <span className="text-sm text-neutral-500">
              {uploadProgress && uploadProgress.total > 1
                ? t('upload.batch_progress$done$total', { done: uploadProgress.done, total: uploadProgress.total })
                : t('uploading')}
            </span>
          </div>
        }
      </FlatInset>
      <div className={`grid grid-cols-1 gap-0 sm:gap-4 ${preview === 'comparison' ? "lg:grid-cols-2" : ""}`}>
        <div className={"flex min-w-0 flex-col " + (preview === 'preview' ? "hidden" : "")}>
          <div
            className={"relative min-h-0 overflow-hidden rounded-none border-0 bg-w"}
            onDrop={(e) => {
              e.preventDefault();
              const editor = editorRef.current;
              if (!editor) return;
              const files = Array.from(e.dataTransfer.files).filter(isImageFile);
              if (files.length === 0) return;
              const selection = editor.getSelection();
              if (!selection) return;
              void insertImages(files, selection, showAlert).finally(() => {
                setUploadProgress(null);
              });
            }}
            onPaste={handlePaste}
          >
            <Editor
              onMount={handleEditorMount}
              height={height}
              defaultLanguage="markdown"
              defaultValue={content}
              theme={colorMode === "dark" ? "vs-dark" : "light"}
              options={{
                wordWrap: "on",

                // Chinese IME stability key
                fontFamily: "Sarasa Mono SC, JetBrains Mono, monospace",
                fontLigatures: false,
                letterSpacing: 0,

                fontSize: 14,
                lineNumbers: "off",

                accessibilitySupport: "off",
                unicodeHighlight: { ambiguousCharacters: false },

                renderWhitespace: "none",
                renderControlCharacters: false,
                smoothScrolling: false,

                dragAndDrop: true,
                pasteAs: { enabled: false },
              }}
            />
          </div>
        </div>
        <div
          className={"min-h-0 overflow-y-auto rounded-none border-0 bg-w px-4 py-4 border-t sm:border-none " + (preview === 'edit' ? "hidden" : "")}
          style={{ height: height }}
        >
          <Markdown content={content ? content : placeholder} />
        </div>
      </div>
      <AlertUI />
    </div>
  );
}
