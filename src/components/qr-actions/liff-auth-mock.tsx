"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard } from "@fortawesome/free-solid-svg-icons";

/** QR コードアクションの「認証ページ」(LIFF) のモック表示。Form と一覧ダイアログで共用。 */
export function LiffAuthMock({ accountName }: { accountName: string }) {
    return (
        <div className="w-64 shrink-0 rounded-xl border border-border bg-white text-gray-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-gray-500 border-b border-gray-100">
                <span>認証</span>
                <span>キャンセル</span>
            </div>
            <div className="px-4 pb-4 pt-3 text-center">
                <div className="mx-auto size-14 rounded-full bg-emerald-100 grid place-items-center">
                    <FontAwesomeIcon
                        icon={faAddressCard}
                        className="size-6 text-emerald-500"
                    />
                </div>
                <div className="mt-2 font-bold text-sm">{accountName}</div>
                <div className="text-[10px] text-gray-400">提供：—</div>
                <p className="mt-2 text-[10px] text-gray-500 leading-snug text-left">
                    友だち登録で特典やお得な情報をお届けします。
                </p>
                <div className="mt-3 text-[10px] text-gray-600">
                    所在国・地域： 日本
                </div>
                <div className="mt-3 text-left text-[11px] font-bold border-t border-gray-100 pt-3">
                    許可が必要な項目
                </div>
                <div className="mt-2 flex items-center justify-between text-left text-[11px]">
                    <span>プロフィール情報 (必須)</span>
                    <span className="w-7 h-4 rounded-full bg-emerald-400 relative">
                        <span className="absolute right-0.5 top-0.5 size-3 rounded-full bg-white" />
                    </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-left text-[11px]">
                    <span>トークへのメッセージ送信</span>
                    <span className="w-7 h-4 rounded-full bg-emerald-400 relative">
                        <span className="absolute right-0.5 top-0.5 size-3 rounded-full bg-white" />
                    </span>
                </div>
                <button
                    type="button"
                    disabled
                    className="mt-4 w-full rounded-md bg-emerald-500 text-white py-2 text-sm font-bold"
                >
                    許可する
                </button>
                <div className="mt-2 text-[11px] text-gray-500">キャンセル</div>
            </div>
        </div>
    );
}
