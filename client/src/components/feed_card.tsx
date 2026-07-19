import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { timeago } from "../utils/timeago";
import { HashTag } from "./hashtag";
import { useEffect, useRef } from "react";
import { drawBlurhashToCanvas } from "../utils/blurhash";
import { parseImageUrlMetadata } from "../utils/image-upload";
import { useImageLoadState } from "../utils/use-image-load-state";
import { type FeedCardVariant, normalizeFeedCardVariant } from "./feed-card-options";
import { useSiteConfig } from "../hooks/useSiteConfig";

function FeedCardImage({ src, variant }: { src: string; variant: FeedCardVariant }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { src: cleanSrc, blurhash, width, height } = parseImageUrlMetadata(src);
    const { failed, imageRef, loaded, onError, onLoad } = useImageLoadState(cleanSrc);
    const aspectRatio = width && height ? `${width} / ${height}` : undefined;
    const imageFrameClass =
        variant === "editorial"
            ? "relative flex max-h-80 w-full flex-row items-center overflow-hidden rounded-[20px]"
            : variant === "butterfly"
                ? "relative flex h-full w-full flex-row items-center overflow-hidden"
                : "relative mb-2 flex max-h-80 w-full flex-row items-center overflow-hidden rounded-xl";


    useEffect(() => {
        if (!blurhash || !canvasRef.current) {
            return;
        }
        try {
            drawBlurhashToCanvas(canvasRef.current, blurhash);
        } catch (error) {
            console.error("Failed to render blurhash", error);
        }
    }, [blurhash]);

    return (
        <div
            className={imageFrameClass}
            style={variant === "butterfly" ? undefined : { aspectRatio }}
        >
            {blurhash && !loaded ? (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-sm"
                />
            ) : null}
            <img
                ref={imageRef}
                src={cleanSrc}
                alt=""
                width={width}
                height={height}
                onLoad={onLoad}
                onError={onError}
                className={`absolute inset-0 h-full w-full object-cover object-center hover:scale-105 translation duration-300 ${blurhash && (!loaded || failed) ? "opacity-0" : "opacity-100"
                    }`}
            />
        </div>
    );
}

const FEED_CARD_STYLES: Record<
    FeedCardVariant,
    {
        card: string;
        imageWrap: string;
        meta: string;
        summary: string;
        title: string;
    }
> = {
    default: {
        card: "my-2 inline-block w-full break-inside-avoid rounded-2xl bg-w p-6 duration-300 bg-button",
        imageWrap: "",
        meta: "text-gray-400 text-sm",
        summary: "line-clamp-4 text-pretty overflow-hidden dark:text-neutral-500",
        title: "text-xl font-bold text-gray-700 dark:text-white text-pretty overflow-hidden",
    },
    editorial: {
        card: "my-3 inline-block w-full break-inside-avoid overflow-hidden rounded-[28px] border border-black/10 bg-w p-3 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] dark:border-white/10",
        imageWrap: "mb-3 overflow-hidden rounded-[22px] border border-black/5 dark:border-white/10",
        meta: "text-[12px] font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400",
        summary: "line-clamp-5 text-pretty text-[15px] leading-7 text-neutral-600 dark:text-neutral-300",
        title: "text-2xl font-semibold tracking-[-0.02em] text-neutral-900 dark:text-white text-pretty overflow-hidden",
    },
    butterfly: {
        card: "my-4 inline-block w-full overflow-hidden rounded-[28px] border border-black/5 bg-w shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-neutral-900 flex flex-col",
        imageWrap: "",
        meta: "flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400",
        summary: "line-clamp-3 text-pretty text-base leading-7 text-neutral-600 dark:text-neutral-300",
        title: "text-2xl font-bold text-neutral-900 dark:text-white text-pretty overflow-hidden leading-tight",
    },
};

export type FeedCardProps = {
    id: string;
    avatar?: string;
    draft?: number;
    listed?: number;
    top?: number;
    title: string;
    summary: string;
    hashtags: { id: number, name: string }[];
    createdAt: Date;
    updatedAt: Date;
    preview?: boolean;
    variant?: FeedCardVariant;
    index?: number;
};

export function FeedCard({ id, title, avatar, draft, listed, top, summary, hashtags, createdAt, updatedAt, preview = false, variant, index }: FeedCardProps) {
    const { t } = useTranslation();
    const siteConfig = useSiteConfig();
    const activeVariant = normalizeFeedCardVariant(variant ?? siteConfig.feedCardVariant);
    const styles = FEED_CARD_STYLES[activeVariant];

    if (activeVariant === "butterfly") {
        const isReversed = index !== undefined && index % 2 === 1;
        const body = (
            <div className={`${styles.card} ${isReversed ? "md:flex-row-reverse" : "md:flex-row"}`}>
                {avatar ? (
                    <div className="h-56 w-full shrink-0 overflow-hidden md:h-auto md:w-[42%] md:min-h-[280px]">
                        <FeedCardImage src={avatar} variant="butterfly" />
                    </div>
                ) : null}
                <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                    <h2 className={styles.title}>{title}</h2>
                    <p className={`mt-3 ${styles.meta}`}>
                        <span className="inline-flex items-center gap-1.5" title={new Date(createdAt).toLocaleString()}>
                            <i className="ri-calendar-line" aria-hidden="true" />
                            <span>
                                {createdAt === updatedAt ? timeago(createdAt) : t('feed_card.published$time', { time: timeago(createdAt) })}
                            </span>
                        </span>
                        {createdAt !== updatedAt && (
                            <span className="inline-flex items-center gap-1.5" title={new Date(updatedAt).toLocaleString()}>
                                <i className="ri-refresh-line" aria-hidden="true" />
                                <span>{t('feed_card.updated$time', { time: timeago(updatedAt) })}</span>
                            </span>
                        )}
                        {hashtags.length > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <i className="ri-bookmark-line" aria-hidden="true" />
                                <span>{hashtags.map(({ name }) => name).join(", ")}</span>
                            </span>
                        )}
                    </p>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        {draft === 1 && <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{t("draft")}</span>}
                        {listed === 0 && <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{t("unlisted")}</span>}
                        {top === 1 && <span className="rounded-full bg-theme/10 px-2.5 py-0.5 text-theme">{t('article.top.title')}</span>}
                    </p>
                    <p className={`mt-4 ${styles.summary}`}>{summary}</p>
                    {hashtags.length > 0 && (
                        <div className="mt-4 flex flex-row flex-wrap justify-start gap-2">
                            {hashtags.map(({ name }, tagIndex) => (
                                <HashTag key={tagIndex} name={name} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
        return preview ? body : <Link href={`/feed/${id}`} target="_blank" className="block w-full">{body}</Link>;
    }

    const body = (
        <div className={styles.card}>
            {avatar ? (
                <div className={styles.imageWrap}>
                    <FeedCardImage src={avatar} variant={activeVariant} />
                </div>
            ) : null}
            <div className={activeVariant === "editorial" ? "px-2 pb-2" : ""}>
                <h1 className={styles.title}>{title}</h1>
                <p className={`space-x-2 ${styles.meta}`}>
                    <span title={new Date(createdAt).toLocaleString()}>
                        {createdAt === updatedAt ? timeago(createdAt) : t('feed_card.published$time', { time: timeago(createdAt) })}
                    </span>
                    {createdAt !== updatedAt &&
                        <span title={new Date(updatedAt).toLocaleString()}>
                            {t('feed_card.updated$time', { time: timeago(updatedAt) })}
                        </span>
                    }
                </p>
                <p className={`space-x-2 ${styles.meta} ${activeVariant === "editorial" ? "mt-2" : ""}`}>
                    {draft === 1 && <span>{t("draft")}</span>}
                    {listed === 0 && <span>{t("unlisted")}</span>}
                    {top === 1 && <span className="text-theme">{t('article.top.title')}</span>}
                </p>
                <p className={`${styles.summary} ${activeVariant === "editorial" ? "mt-4 max-w-3xl" : ""}`}>{summary}</p>
                {hashtags.length > 0 &&
                    <div className={`flex flex-row flex-wrap justify-start gap-2 ${activeVariant === "editorial" ? "mt-4" : "mt-2 gap-x-2"}`}>
                        {hashtags.map(({ name }, tagIndex) => (
                            <HashTag key={tagIndex} name={name} />
                        ))}
                    </div>
                }
            </div>
        </div>
    );

    return preview ? body : <Link href={`/feed/${id}`} target="_blank" className="block w-full">{body}</Link>;
}
