"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faRotateLeft,
    faRotateRight,
    faBold,
    faItalic,
    faAlignLeft,
    faAlignCenter,
    faAlignRight,
    faAlignJustify,
    faOutdent,
    faIndent,
    faLink,
    faCode,
    faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * TinyMCE 風の軽量リッチテキストエディタ（contentEditable + execCommand）。
 * value は HTML 文字列。表示側は HTML をそのままレンダリングする想定。
 */
export function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
}: {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColors, setShowColors] = useState(false);
    const [codeView, setCodeView] = useState(false);

    // value が外部から変わった時だけ DOM に反映（入力中はキャレットを壊さない）
    useEffect(() => {
        const el = editorRef.current;
        if (el && el.innerHTML !== value) {
            el.innerHTML = value;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emit = () => {
        const el = editorRef.current;
        if (el) onChange(el.innerHTML);
    };

    const exec = (command: string, arg?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, arg);
        emit();
    };

    const applyBlock = (tag: string) => {
        exec("formatBlock", tag);
    };

    const applyLink = () => {
        const url = window.prompt("リンク先 URL を入力してください", "https://");
        if (url) exec("createLink", url);
    };

    const COLORS = [
        "#111827",
        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#06b6d4",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
        "#ffffff",
    ];

    const isEmpty = value === "" || value === "<br>" || value === "<p></p>";

    return (
        <div
            className={cn(
                "rounded-md border border-input bg-background overflow-hidden",
                className,
            )}
        >
            {/* ツールバー */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
                <ToolbarButton icon={faRotateLeft} label="元に戻す" onClick={() => exec("undo")} />
                <ToolbarButton icon={faRotateRight} label="やり直し" onClick={() => exec("redo")} />
                <Divider />
                <select
                    onChange={(e) => {
                        applyBlock(e.target.value);
                        e.target.selectedIndex = 0;
                    }}
                    className="h-7 rounded border border-input bg-background px-2 text-xs"
                    defaultValue=""
                >
                    <option value="" disabled>
                        段落
                    </option>
                    <option value="p">段落</option>
                    <option value="h1">見出し1</option>
                    <option value="h2">見出し2</option>
                    <option value="h3">見出し3</option>
                    <option value="h4">見出し4</option>
                </select>
                <Divider />
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowColors((s) => !s)}
                        className="flex h-7 items-center gap-0.5 rounded px-1.5 text-muted-foreground hover:bg-muted"
                        title="文字色"
                    >
                        <span className="text-sm font-bold leading-none underline decoration-2 decoration-red-500">
                            A
                        </span>
                        <FontAwesomeIcon icon={faChevronDown} className="size-2.5" />
                    </button>
                    {showColors && (
                        <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-5 gap-1 rounded-md border border-border bg-popover p-2 shadow-lg">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                        exec("foreColor", c);
                                        setShowColors(false);
                                    }}
                                    className="size-5 rounded border border-border"
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <ToolbarButton icon={faBold} label="太字" onClick={() => exec("bold")} />
                <ToolbarButton icon={faItalic} label="斜体" onClick={() => exec("italic")} />
                <Divider />
                <ToolbarButton icon={faAlignLeft} label="左揃え" onClick={() => exec("justifyLeft")} />
                <ToolbarButton icon={faAlignCenter} label="中央揃え" onClick={() => exec("justifyCenter")} />
                <ToolbarButton icon={faAlignRight} label="右揃え" onClick={() => exec("justifyRight")} />
                <ToolbarButton icon={faAlignJustify} label="両端揃え" onClick={() => exec("justifyFull")} />
                <Divider />
                <ToolbarButton icon={faOutdent} label="字下げ解除" onClick={() => exec("outdent")} />
                <ToolbarButton icon={faIndent} label="字下げ" onClick={() => exec("indent")} />
                <Divider />
                <ToolbarButton icon={faLink} label="リンク" onClick={applyLink} />
                <ToolbarButton
                    icon={faCode}
                    label="HTML 編集"
                    active={codeView}
                    onClick={() => setCodeView((s) => !s)}
                />
            </div>

            {/* 本文 */}
            {codeView ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={8}
                    className="block w-full resize-y bg-background p-3 font-mono text-xs outline-none"
                    placeholder="<p>HTML を直接編集</p>"
                />
            ) : (
                <div className="relative">
                    {isEmpty && placeholder && (
                        <div className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">
                            {placeholder}
                        </div>
                    )}
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={emit}
                        onBlur={emit}
                        className="prose-editor min-h-[180px] w-full p-3 text-sm leading-relaxed outline-none"
                    />
                </div>
            )}
        </div>
    );
}

function ToolbarButton({
    icon,
    label,
    onClick,
    active,
}: {
    icon: typeof faBold;
    label: string;
    onClick: () => void;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className={cn(
                "flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted",
                active && "bg-primary/10 text-primary",
            )}
        >
            <FontAwesomeIcon icon={icon} className="size-3.5" />
        </button>
    );
}

function Divider() {
    return <span className="mx-1 h-5 w-px bg-border" />;
}
