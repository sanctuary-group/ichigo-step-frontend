import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faImage,
    faVideo,
    faMusic,
    faSpinner,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadImage, uploadMedia } from "@/lib/api/uploads";

export type MediaKind = "image" | "video" | "audio";

export type MediaChange = {
    message_type: MediaKind;
    url: string;
    preview_url?: string;
    duration?: number | null;
};

const MEDIA_CARDS: {
    kind: MediaKind;
    label: string;
    icon: typeof faImage;
    accept: string;
}[] = [
    {
        kind: "image",
        label: "画像",
        icon: faImage,
        accept: "image/png,image/jpeg,image/jpg",
    },
    { kind: "video", label: "動画", icon: faVideo, accept: "video/mp4" },
    { kind: "audio", label: "音声", icon: faMusic, accept: "audio/*,.m4a" },
];

const MEDIA_FORMATS = [
    { label: "画像", ext: ".png / .jpg", size: "10MBまで" },
    { label: "動画", ext: ".mp4", size: "200MBまで" },
    { label: "音声", ext: ".m4a", size: "200MBまで" },
];

function readVideoMeta(
    file: File,
): Promise<{ duration: number; thumb: Blob }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        const objUrl = URL.createObjectURL(file);
        video.src = objUrl;
        video.onloadedmetadata = () => {
            video.currentTime = Math.min(0.1, video.duration / 2 || 0);
        };
        video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const duration = Math.round((video.duration || 0) * 1000);
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(objUrl);
                    if (blob) resolve({ duration, thumb: blob });
                    else reject(new Error("サムネイル生成に失敗しました"));
                },
                "image/jpeg",
                0.8,
            );
        };
        video.onerror = () => {
            URL.revokeObjectURL(objUrl);
            reject(new Error("動画の読み込みに失敗しました"));
        };
    });
}

function readAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = document.createElement("audio");
        audio.preload = "metadata";
        const objUrl = URL.createObjectURL(file);
        audio.src = objUrl;
        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(objUrl);
            resolve(Math.round((audio.duration || 0) * 1000));
        };
        audio.onerror = () => {
            URL.revokeObjectURL(objUrl);
            reject(new Error("音声の読み込みに失敗しました"));
        };
    });
}

/**
 * 画像 / 動画 / 音声を 1 つのウィジェットで扱う汎用アップローダ。
 * アップロードは tenant API の /uploads/* を使う（uploads.ts 経由）。
 * 動画はクライアント側でサムネイル + 再生時間を抽出して送る。
 * uploadImageEndpoint / uploadMediaEndpoint は monolith 互換のため受け取るが未使用。
 */
export function MediaUploader({
    mediaType,
    url,
    onChange,
}: {
    mediaType: MediaKind;
    url: string;
    onChange: (change: MediaChange) => void;
    uploadImageEndpoint?: string;
    uploadMediaEndpoint?: string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [accept, setAccept] = useState<string>("image/*,video/*,audio/*");
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const detectKind = (file: File): MediaKind | null => {
        if (file.type.startsWith("image/")) return "image";
        if (file.type.startsWith("video/")) return "video";
        if (file.type.startsWith("audio/") || /\.m4a$/i.test(file.name))
            return "audio";
        return null;
    };

    const upload = async (file: File) => {
        const kind = detectKind(file);
        if (!kind) {
            setError("対応していないファイル形式です");
            return;
        }
        setUploading(true);
        setError(null);
        try {
            if (kind === "image") {
                const u = await uploadImage(file);
                onChange({ message_type: "image", url: u, preview_url: u });
            } else if (kind === "video") {
                const { duration, thumb } = await readVideoMeta(file);
                const [u, preview] = await Promise.all([
                    uploadMedia(file, "video"),
                    uploadImage(thumb),
                ]);
                onChange({
                    message_type: "video",
                    url: u,
                    preview_url: preview,
                    duration,
                });
            } else {
                const duration = await readAudioDuration(file);
                const u = await uploadMedia(file, "audio");
                onChange({ message_type: "audio", url: u, duration });
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "アップロード失敗");
        } finally {
            setUploading(false);
        }
    };

    const pick = (cardAccept: string) => {
        setAccept(cardAccept);
        requestAnimationFrame(() => fileRef.current?.click());
    };

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
        e.target.value = "";
    };

    const reset = () =>
        onChange({ message_type: mediaType, url: "", preview_url: "" });

    return (
        <div className="space-y-4">
            <input
                ref={fileRef}
                type="file"
                accept={accept}
                onChange={onFile}
                hidden
            />

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) upload(file);
                }}
                className={cn(
                    "rounded-md border-2 border-dashed p-8 transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-primary/50",
                )}
            >
                {url ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            {mediaType === "image" && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={url}
                                    alt="プレビュー"
                                    className="max-w-xs max-h-64 rounded-md border border-border"
                                />
                            )}
                            {mediaType === "video" && (
                                <video
                                    src={url}
                                    controls
                                    className="max-w-sm max-h-64 rounded-md border border-border"
                                />
                            )}
                            {mediaType === "audio" && (
                                <audio src={url} controls className="w-72" />
                            )}
                            <button
                                type="button"
                                onClick={reset}
                                className="absolute -top-2 -right-2 size-7 rounded-full bg-background hover:bg-muted border border-border inline-flex items-center justify-center shadow-sm"
                                aria-label="削除"
                            >
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    className="size-3.5"
                                />
                            </button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileRef.current?.click()}
                        >
                            変更
                        </Button>
                    </div>
                ) : uploading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="size-7 text-primary"
                        />
                        <span className="text-sm text-muted-foreground">
                            アップロード中...
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-5">
                        <div className="flex items-start justify-center gap-6">
                            {MEDIA_CARDS.map((c) => (
                                <button
                                    key={c.kind}
                                    type="button"
                                    onClick={() => pick(c.accept)}
                                    className="w-28 overflow-hidden rounded-md border border-primary/40 bg-background transition-shadow hover:shadow-md"
                                >
                                    <div className="bg-primary py-2 text-center text-sm font-bold text-primary-foreground">
                                        {c.label}
                                    </div>
                                    <div className="flex items-center justify-center py-6">
                                        <FontAwesomeIcon
                                            icon={c.icon}
                                            className="size-10 text-primary"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                            ここにファイルをドロップ
                            <br />
                            または
                        </div>
                        <Button
                            type="button"
                            className="bg-primary/70 text-primary-foreground hover:bg-primary px-8"
                            onClick={() => {
                                setAccept("image/*,video/*,audio/*");
                                requestAnimationFrame(() =>
                                    fileRef.current?.click(),
                                );
                            }}
                        >
                            PCから選択
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <p className="text-sm font-bold">対応フォーマット</p>
                <table className="w-full max-w-xl border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 text-center">
                            <th className="px-3 py-2 font-bold">データ形式</th>
                            <th className="px-3 py-2 font-bold">対応形式</th>
                            <th className="px-3 py-2 font-bold">最大データ容量</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MEDIA_FORMATS.map((f) => (
                            <tr
                                key={f.label}
                                className="border-b border-border text-center"
                            >
                                <td className="px-3 py-2">{f.label}</td>
                                <td className="px-3 py-2">{f.ext}</td>
                                <td className="px-3 py-2">{f.size}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
