import * as Switch from "@radix-ui/react-switch";
import { type ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactLoading from "react-loading";
import { Button } from "../components/button";
import { useConfirm } from "../components/dialog";
import { ImageUploadInput } from "../components/image-upload-input";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsCardRow,
  SettingsSectionTitle,
} from "@rin/ui";
import { GRADIENT_PRESETS, type GradientPresetKey } from "../utils/background";

export function ItemTitle({ title }: { title: string }) {
  return <SettingsSectionTitle title={title} />;
}

export function ItemSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="w-full">
      <SettingsCard>
        <SettingsCardRow
          header={<SettingsCardHeader title={title} description={description} />}
          action={
            <Switch.Root className="SwitchRoot" checked={checked} onCheckedChange={onChange}>
              <Switch.Thumb className="SwitchThumb" />
            </Switch.Root>
          }
        />
      </SettingsCard>
    </div>
  );
}

export function ItemInput({
  title,
  configKeyTitle,
  description,
  value,
  placeholder,
  onChange,
}: {
  title: string;
  description: string;
  configKeyTitle: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <SettingsCard>
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => {
            setIsOpen((current) => {
              return !current;
            });
          }}
        >
          <SettingsCardRow
            header={<SettingsCardHeader title={title} description={description} />}
            action={
              <div className="flex items-center gap-3">
                <span className="max-w-56 truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {value || placeholder || configKeyTitle}
                </span>
                <i
                  className={`ri-arrow-down-s-line text-lg text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </div>
            }
          />
        </button>
        {isOpen ? (
          <SettingsCardBody>
            <textarea
              placeholder={placeholder || configKeyTitle}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
              }}
              className="min-h-36 w-full rounded-xl border border-black/10 bg-w px-4 py-3 text-sm t-primary outline-none transition-colors placeholder:text-neutral-400 focus:border-black/20 focus:ring-2 focus:ring-theme/10 dark:border-white/10 dark:placeholder:text-neutral-500 dark:focus:border-white/20"
            />
          </SettingsCardBody>
        ) : null}
      </SettingsCard>
    </div>
  );
}

export function ItemButton({
  title,
  description,
  buttonTitle,
  onConfirm,
  alertTitle,
  alertDescription,
}: {
  title: string;
  description: string;
  buttonTitle: string;
  onConfirm: () => Promise<void>;
  alertTitle: string;
  alertDescription: string;
}) {
  const { showConfirm, ConfirmUI } = useConfirm();

  return (
    <div className="w-full">
      <SettingsCard>
        <SettingsCardRow
          header={<SettingsCardHeader title={title} description={description} />}
          action={
            <Button
              title={buttonTitle}
              onClick={() => {
                showConfirm(alertTitle, alertDescription, onConfirm);
              }}
            />
          }
        />
      </SettingsCard>
      <ConfirmUI />
    </div>
  );
}

export function ItemWithUpload({
  title,
  description,
  accept,
  onFileChange,
}: {
  title: string;
  description: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    try {
      await onFileChange(event);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <SettingsCard>
        <SettingsCardRow
          header={<SettingsCardHeader title={title} description={description} />}
          action={
            <>
              {loading && <ReactLoading width="1em" height="1em" type="spin" color="#FC466B" />}
              <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleFileChange} />
              <Button
                onClick={() => {
                  inputRef.current?.click();
                }}
                title={t("upload.title")}
              />
            </>
          }
        />
      </SettingsCard>
    </div>
  );
}

export function ItemImageInput({
  title,
  description,
  configKeyTitle,
  value,
  placeholder,
  onChange,
  onError,
  shape = "rounded",
}: {
  title: string;
  description: string;
  configKeyTitle: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onError?: (message: string) => void;
  shape?: "rounded" | "circle";
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <SettingsCard>
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => {
            setIsOpen((current) => !current);
          }}
        >
          <SettingsCardRow
            header={<SettingsCardHeader title={title} description={description} />}
            action={
              <div className="flex items-center gap-3">
                {value ? (
                  <img
                    src={value}
                    alt={configKeyTitle}
                    className={`h-10 w-10 object-cover ${shape === "circle" ? "rounded-full" : "rounded-2xl"}`}
                  />
                ) : null}
                <span className="max-w-56 truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {value || placeholder || configKeyTitle}
                </span>
                <i
                  className={`ri-arrow-down-s-line text-lg text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </div>
            }
          />
        </button>
        {isOpen ? (
          <SettingsCardBody>
            <ImageUploadInput
              value={value}
              onChange={onChange}
              onError={onError}
              placeholder={placeholder || configKeyTitle}
              shape={shape}
            />
          </SettingsCardBody>
        ) : null}
      </SettingsCard>
    </div>
  );
}

// ============================================================================
// Background Settings
// ============================================================================

const BACKGROUND_TYPE_OPTIONS = ["none", "image", "gradient"] as const;
type BackgroundType = (typeof BACKGROUND_TYPE_OPTIONS)[number];

export function ItemBackgroundType({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: BackgroundType;
  onChange: (value: BackgroundType) => void;
}) {
  return (
    <div className="w-full">
      <SettingsCard>
        <SettingsCardRow
          header={<SettingsCardHeader title={title} description={description} />}
          action={
            <div className="flex gap-2">
              {BACKGROUND_TYPE_OPTIONS.map((type) => {
                const selected = value === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onChange(type)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                      selected
                        ? "border-theme bg-theme/5 text-theme shadow-sm"
                        : "border-black/10 bg-white text-neutral-600 hover:border-black/20 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-white/20"
                    }`}
                  >
                    {type === "none" ? "无背景" : type === "image" ? "背景图片" : "渐变色"}
                  </button>
                );
              })}
            </div>
          }
        />
      </SettingsCard>
    </div>
  );
}

export function ItemBackgroundImage({
  title,
  description,
  value,
  opacity,
  onChange,
  onOpacityChange,
}: {
  title: string;
  description: string;
  value: string;
  opacity: number;
  onChange: (value: string) => void;
  onOpacityChange: (opacity: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <SettingsCard>
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => setIsOpen((current) => !current)}
        >
          <SettingsCardRow
            header={<SettingsCardHeader title={title} description={description} />}
            action={
              <div className="flex items-center gap-3">
                {value ? (
                  <img
                    src={value}
                    alt="Background"
                    className="h-10 w-10 rounded-2xl object-cover"
                  />
                ) : null}
                <span className="max-w-56 truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {value || "背景图片 URL"}
                </span>
                <i
                  className={`ri-arrow-down-s-line text-lg text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </div>
            }
          />
        </button>
        {isOpen ? (
          <SettingsCardBody>
            <div className="space-y-4">
              <ImageUploadInput
                value={value}
                onChange={onChange}
                placeholder="填写背景图片 URL，或上传一张图片"
                shape="rounded"
              />
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">透明度</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={opacity}
                  onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-theme dark:bg-neutral-700"
                />
                <span className="w-12 text-right text-sm text-neutral-600 dark:text-neutral-400">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              {value && (
                <div className="mt-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">预览：</p>
                  <div
                    className="mt-1 h-32 w-full rounded-xl bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url("${value}")`,
                      opacity: opacity,
                    }}
                  />
                </div>
              )}
            </div>
          </SettingsCardBody>
        ) : null}
      </SettingsCard>
    </div>
  );
}

export function ItemBackgroundGradient({
  title,
  description,
  value,
  onChange,
  t,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse current gradient value to extract colors and angle
  function parseGradient(gradient: string): { color1: string; color2: string; angle: number; preset: string | null } {
    const match = gradient.match(/^linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{3,8})\s*0%,\s*(#[0-9a-fA-F]{3,8})\s*100%\)$/);
    if (match) {
      return { color1: match[2], color2: match[3], angle: parseInt(match[1], 10), preset: null };
    }
    // Try to find preset key
    for (const key of Object.keys(GRADIENT_PRESETS) as GradientPresetKey[]) {
      if (GRADIENT_PRESETS[key] === gradient) {
        return { color1: "", color2: "", angle: 135, preset: key };
      }
    }
    return { color1: "#667eea", color2: "#764ba2", angle: 135, preset: null };
  }

  const parsed = parseGradient(value);

  function buildGradient(color1: string, color2: string, angle: number): string {
    return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
  }

  return (
    <div className="w-full">
      <SettingsCard>
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => setIsOpen((current) => !current)}
        >
          <SettingsCardRow
            header={<SettingsCardHeader title={title} description={description} />}
            action={
              parsed.preset ? (
                <span className="max-w-56 truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {t(`settings.background.presets.options.${parsed.preset}`)}
                </span>
              ) : (
                <div className="flex h-5 w-5 shrink-0 items-center rounded-full" style={{
                  background: parsed.color1 ? `linear-gradient(135deg, ${parsed.color1}, ${parsed.color2})` : undefined,
                }} />
              )
            }
          />
        </button>
        {isOpen ? (
          <SettingsCardBody>
            <div className="space-y-4">
              {/* Preset Gradients */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("settings.background.presets.title")}
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {(Object.keys(GRADIENT_PRESETS) as GradientPresetKey[]).map((key) => {
                    const presetValue = GRADIENT_PRESETS[key];
                    const selected = value === presetValue;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChange(presetValue)}
                        className={`group relative h-16 w-full overflow-hidden rounded-xl border-2 transition-all ${
                          selected
                            ? "border-theme shadow-md"
                            : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                        }`}
                      >
                        <div
                          className="absolute inset-0"
                          style={{ background: presetValue }}
                        />
                        <span className="relative z-10 flex h-full w-full items-center justify-center text-xs font-medium text-white drop-shadow">
                          {t(`settings.background.presets.options.${key}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-black/5 pt-4 dark:border-white/5" />

              {/* Custom Gradient */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("settings.background.gradient.label")}
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-neutral-600 dark:text-neutral-300">{t("settings.background.gradient.start_color")}</label>
                    <input
                      type="color"
                      value={parsed.color1 || "#667eea"}
                      onChange={(e) => {
                        onChange(buildGradient(e.target.value, parsed.color2, parsed.angle));
                      }}
                      className="h-8 w-12 cursor-pointer rounded-lg border border-black/10 bg-transparent p-0 dark:border-white/10"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-neutral-600 dark:text-neutral-300">{t("settings.background.gradient.end_color")}</label>
                    <input
                      type="color"
                      value={parsed.color2 || "#764ba2"}
                      onChange={(e) => {
                        onChange(buildGradient(parsed.color1, e.target.value, parsed.angle));
                      }}
                      className="h-8 w-12 cursor-pointer rounded-lg border border-black/10 bg-transparent p-0 dark:border-white/10"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-neutral-600 dark:text-neutral-300">{t("settings.background.gradient.angle")}</label>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={parsed.angle}
                      onChange={(e) => {
                        onChange(buildGradient(parsed.color1, parsed.color2, parseInt(e.target.value, 10)));
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-theme dark:bg-neutral-700"
                    />
                    <span className="w-10 shrink-0 text-right text-sm text-neutral-600 dark:text-neutral-300">{parsed.angle}°</span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {value && (
                <div className="mt-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("settings.background.preview")}</p>
                  <div
                    className="mt-1 h-32 w-full rounded-xl"
                    style={{ background: value }}
                  />
                </div>
              )}
            </div>
          </SettingsCardBody>
        ) : null}
      </SettingsCard>
    </div>
  );
}
