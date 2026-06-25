"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlug,
    faGlobe,
    faMobileScreen,
    faQrcode,
    faChevronRight,
    faTriangleExclamation,
    faLightbulb,
    faCircleInfo,
    faImage,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { cn } from "@/lib/utils";

type TopicId = "connection" | "webhook" | "liff" | "qr";

type StepImage = {
    /** public/images/guide/ 配下のパス */
    src: string;
    caption?: string;
};

type Step = {
    title: string;
    body: string[];
    note?: string;
    tip?: string;
    image?: StepImage;
    images?: StepImage[];
};

type Guide = {
    id: TopicId;
    label: string;
    icon: IconDefinition;
    intro: string;
    steps: Step[];
};

const GUIDES: Guide[] = [
    {
        id: "connection",
        label: "LINE公式アカウント接続",
        icon: faPlug,
        intro: "LINE Developers で Messaging API チャネルを作成し、本ツールに接続します。最初に必ず行う設定です。",
        steps: [
            {
                title: "LINE Developers にログインしてプロバイダーを用意する",
                body: [
                    "LINE Developers Console（developers.line.biz）に、LINE公式アカウントを作成したLINEアカウントでログインします。",
                    "「ビジネスアカウントでログイン」または「LINEアカウント」から、お持ちのアカウントでログインしてください。",
                    "プロバイダーが無い場合は「Create a new provider」から作成します（会社名・サービス名など任意の名前でOK）。",
                ],
                tip: "プロバイダーは「会社・サービスの入れ物」です。後で LIFF 用の LINEログインチャネルも同じプロバイダー内に作るので、1つにまとめておくと管理が楽です。",
                image: {
                    src: "/images/guide/connection-01.png",
                    caption: "LINEヤフー Business ID のログイン画面",
                },
            },
            {
                title: "Messaging API チャネルを作成する",
                body: [
                    "プロバイダーを開き、チャネルの種類から「Messaging API」を選びます。",
                    "既にLINE公式アカウントがある場合は、LINE Official Account Manager の『設定 → Messaging API』から「Messaging APIを利用する」を有効化すると、対応するチャネルが作成されます。",
                    "チャネル名・説明・カテゴリなどを入力して作成します。",
                ],
                image: {
                    src: "/images/guide/connection-02.png",
                    caption: "チャネルの種類で「Messaging API」を選択",
                },
            },
            {
                title: "Channel ID / Channel secret を取得する",
                body: [
                    "LINE公式アカウントマネージャーの「設定 → Messaging API」を開きます。",
                    "「Channel ID」と「Channel secret」を、それぞれの「コピー」ボタンで控えておきます（後で本ツールに貼り付けます）。",
                ],
                tip: "Channel ID / Channel secret は LINE Developers Console の「チャネル基本設定」からも確認できます。どちらの画面で取得しても同じ値です。",
                image: {
                    src: "/images/guide/connection-03.png",
                    caption: "LINE公式アカウントマネージャーの Messaging API 画面（Channel ID / Channel secret）",
                },
            },
            {
                title: "チャネルアクセストークンを発行する",
                body: [
                    "チャネルの「Messaging API設定」タブを開きます。",
                    "下部の「チャネルアクセストークン（長期）」で「発行」ボタンを押すと、長いトークンが生成されます。",
                    "発行された長いトークンをコピーします。",
                ],
                note: "チャネルアクセストークンは再発行すると古いトークンが無効になります。本ツールへ貼り付けるまで画面を閉じないでください。",
                images: [
                    {
                        src: "/images/guide/connection-04.png",
                        caption: "①「Messaging API設定」タブを開く",
                    },
                    {
                        src: "/images/guide/connection-05.png",
                        caption: "②「発行」ボタンでトークンを発行",
                    },
                    {
                        src: "/images/guide/connection-06.png",
                        caption: "③ 発行されたトークンをコピー",
                    },
                ],
            },
            {
                title: "本ツールにチャネルを登録する",
                body: [
                    "本ツールの「設定 → LINE公式アカウント」を開き、「チャネルを追加」をクリックします。",
                    "表示名（社内管理用・任意）、Channel ID、Channel secret、チャネルアクセストークンを貼り付けて「登録」します。",
                    "ベーシックID（@から始まるID）も入力しておくと、QRコードや友だち追加リンクで使われます。",
                ],
                images: [
                    {
                        src: "/images/guide/connection-07.png",
                        caption: "①「チャネルを追加」をクリック",
                    },
                    {
                        src: "/images/guide/connection-08.png",
                        caption: "② 各項目を貼り付けて「登録」",
                    },
                ],
            },
            {
                title: "接続テストを行う",
                body: [
                    "登録したチャネルの「接続テスト」ボタンをクリックします。",
                    "「接続成功」と表示されれば接続完了です。エラーが出る場合は Channel secret / アクセストークンを再確認してください。",
                ],
                tip: "接続できたら、次は「Webhook設定」で受信を有効化します。これをしないと友だち追加や1:1チャットが動きません。",
                images: [
                    {
                        src: "/images/guide/connection-09.png",
                        caption: "①「接続テスト」ボタンをクリック",
                    },
                    {
                        src: "/images/guide/connection-10.png",
                        caption: "②「接続成功」が表示されれば完了",
                    },
                ],
            },
        ],
    },
    {
        id: "webhook",
        label: "Webhook設定（受信を有効化）",
        icon: faGlobe,
        intro: "Webhook を設定すると、友だち追加・メッセージ受信・ブロックなどのイベントを本ツールが受け取れるようになります。あいさつ・自動応答・ステップ配信のトリガーにも必須です。",
        steps: [
            {
                title: "本ツールでチャネルの Webhook URL をコピーする",
                body: [
                    "「設定 → LINE公式アカウント」を開き、対象チャネルの「接続テスト」を実行して成功させます。",
                    "接続テストに成功すると、そのチャネルのカードに専用の Webhook URL が表示されます（Channel ID が埋め込まれた完全なURLなので、置き換え作業は不要です）。",
                    "「コピー」ボタンで URL をコピーします。",
                ],
                tip: "Webhook URL はチャネルごとに異なります。複数チャネルを登録している場合は、設定したいチャネルのカードに表示された URL をコピーしてください。",
                note: "接続テストに成功していないチャネルでは Webhook URL は表示されません。先に「LINE公式アカウント接続」を済ませてください。",
                image: {
                    src: "/images/guide/webhook-01.png",
                    caption: "接続テスト成功後に表示される、チャネル専用の Webhook URL とコピーボタン",
                },
            },
            {
                title: "LINE Developers に Webhook URL を設定する",
                body: [
                    "LINE Developers Console で対象のチャネルを開き、「Messaging API設定」タブを開きます。",
                    "「Webhook設定」の Webhook URL で「編集」をクリックします。",
                    "コピーしたURLを貼り付けて「更新」します。",
                ],
                note: "Webhook URL は HTTPS である必要があります（本ツールのコピーURLはそのまま条件を満たします）。更新後、「検証」ボタンで Success が返ればURL設定は正常です。",
                images: [
                    {
                        src: "/images/guide/webhook-02.png",
                        caption: "①「Messaging API設定」タブを開く",
                    },
                    {
                        src: "/images/guide/webhook-03.png",
                        caption: "② Webhook URL の「編集」をクリック",
                    },
                    {
                        src: "/images/guide/webhook-04.png",
                        caption: "③ コピーしたURLを貼り付けて「更新」",
                    },
                ],
            },
            {
                title: "応答設定を調整する（重要）",
                body: [
                    "LINE Official Account Manager（公式アカウントマネージャー）を開き、右上の「設定」を開きます。",
                    "左メニューの「応答設定」を開きます。",
                    "「応答機能」で『Webhook』を ON、『応答メッセージ』を OFF にします。",
                ],
                note: "「応答メッセージ」がONのままだと、LINEの自動返信と本ツールのメッセージが二重に届きます。必ずOFFにしてください。本ツールのあいさつ機能を使う場合は「あいさつメッセージ」もOFFにしておくと安心です。",
                images: [
                    {
                        src: "/images/guide/webhook-05.png",
                        caption: "① 公式アカウントマネージャー右上の「設定」を開く",
                    },
                    {
                        src: "/images/guide/webhook-06.png",
                        caption: "② 左メニューの「応答設定」を開く",
                    },
                    {
                        src: "/images/guide/webhook-07.png",
                        caption: "③「応答機能」で Webhook を ON にする（応答メッセージは OFF に切り替え）",
                    },
                ],
            },
            {
                title: "あいさつメッセージの扱いを決める",
                body: [
                    "LINE標準の「あいさつメッセージ」を使うか、本ツールの「あいさつメッセージ」で制御するかを決めます。",
                    "本ツールで友だち追加時のアクション（タグ付与・ステップ開始など）を使う場合は、本ツール側のあいさつメッセージを使うのがおすすめです。",
                ],
                tip: "本ツールのあいさつ機能を使うなら、LINE標準のあいさつメッセージはOFFにして二重送信を防ぎましょう。",
            },
            {
                title: "実機で動作確認する",
                body: [
                    "本ツール上部のQRコードアイコンから「友だち追加用QRコード」を表示し、スマホで読み取って対象のLINE公式アカウントを友だち追加します。",
                    "本ツールの「友だちリスト」「1:1チャット」に追加した友だちが表示されれば受信成功です。",
                ],
                tip: "メッセージを送っても友だちが表示されない場合は、Webhook URL の設定（「検証」がSuccess）と応答設定（WebhookがON）をもう一度確認してください。",
                image: {
                    src: "/images/guide/webhook-08.png",
                    caption: "友だち追加用QRコードを表示して、スマホで読み取る",
                },
            },
        ],
    },
    {
        id: "liff",
        label: "LIFF設定（QR・フォームの流入計測に必須）",
        icon: faMobileScreen,
        intro: "LIFF（LINE Front-end Framework）は、QRコードアクションの流入計測やフォームの回答者特定に使います。Messaging APIチャネルには追加できないため、LINEログインチャネルを別途作成します。",
        steps: [
            {
                title: "LINEログインチャネルを作成する",
                body: [
                    "LINE Developers Console で、Messaging APIチャネルと同じプロバイダーを開き、「新規チャネル作成」をクリックします。",
                    "チャネルの種類で「LINEログイン」を選びます。",
                    "アプリタイプは「ウェブアプリ」を選び、必要事項を入力して作成します。",
                ],
                note: "Messaging APIチャネルにはLIFFアプリを追加できません。必ず別途「LINEログインチャネル」を作成してください（同じプロバイダー内に作るのが重要です）。",
                images: [
                    {
                        src: "/images/guide/liff-01.png",
                        caption: "①「新規チャネル作成」をクリック",
                    },
                    {
                        src: "/images/guide/liff-02.png",
                        caption: "② チャネルの種類で「LINEログイン」を選択",
                    },
                    {
                        src: "/images/guide/liff-03.png",
                        caption: "③ アプリタイプは「ウェブアプリ」を選択",
                    },
                ],
            },
            {
                title: "LIFFアプリを追加する",
                body: [
                    "作成したLINEログインチャネルの「LIFF」タブを開き、「追加」でLIFFアプリを追加します。",
                    "サイズは「Full」を選びます。",
                    "エンドポイントURLには、本ツールのLIFF着地URL（例: https://（本番ドメイン）/liff/qr ）を設定します。",
                    "Scope は「openid」「profile」にチェックを入れます。",
                ],
                note: "エンドポイントURLは末尾にトークン等を付けず、/liff/qr のままにしてください。実際の遷移先はツール側で自動的に解決します。",
                images: [
                    {
                        src: "/images/guide/liff-04.png",
                        caption: "①「LIFF」タブを開く",
                    },
                    {
                        src: "/images/guide/liff-05.png",
                        caption: "②「追加」でLIFFアプリを追加",
                    },
                    {
                        src: "/images/guide/liff-06.png",
                        caption: "③ サイズは「Full」を選択",
                    },
                    {
                        src: "/images/guide/liff-07.png",
                        caption: "④ エンドポイントURL（…/liff/qr）を入力",
                    },
                    {
                        src: "/images/guide/liff-08.png",
                        caption: "⑤ Scope は openid・profile にチェック",
                    },
                ],
            },
            {
                title: "友だち追加オプション（ボットリンク機能）を設定する",
                body: [
                    "同じ追加フォームを下にスクロールし、「友だち追加オプション」で『On (Normal)』を選びます。",
                    "設定できたら「追加」ボタンでLIFFアプリを作成します。",
                ],
                note: "友だち追加オプションを有効にすると、LIFFを開いた人に対象のLINE公式アカウントの友だち追加を促せます。リンク先のLINE公式アカウントは、LINEログインチャネルの「LINEログイン設定 → リンクされたLINE公式アカウント」で指定します。",
                tip: "「On (Normal)」は、LIFFを開いた際に友だち追加を促し、追加済みならそのまま進む自然な挙動です。「On (Aggressive)」は毎回追加画面を挟むため、通常は Normal を推奨します。",
                image: {
                    src: "/images/guide/liff-09.png",
                    caption: "友だち追加オプションを「On (Normal)」にして「追加」",
                },
            },
            {
                title: "LIFF ID を本ツールに登録する",
                body: [
                    "作成したLIFFアプリの「LIFF ID」をコピーします。",
                    "本ツールの「設定 → LINE公式アカウント」で対象チャネルの編集（鉛筆アイコン）を開きます。",
                    "「LIFF ID」欄に貼り付けて「保存」します。",
                ],
                images: [
                    {
                        src: "/images/guide/liff-10.png",
                        caption: "① LIFFアプリ一覧で「LIFF ID」をコピー",
                    },
                    {
                        src: "/images/guide/liff-11.png",
                        caption: "② 本ツールで対象チャネルの編集を開く",
                    },
                    {
                        src: "/images/guide/liff-12.png",
                        caption: "③「LIFF ID」欄に貼り付けて「保存」",
                    },
                ],
            },
            {
                title: "動作確認する",
                body: [
                    "QRコードアクションまたはフォームのURLをスマホで開き、LINEログイン画面または友だち追加画面が表示されれば設定成功です。",
                ],
                tip: "404になる場合は、エンドポイントURLのドメイン（本番URL）と /liff/qr の綴りを再確認してください。",
            },
        ],
    },
    {
        id: "qr",
        label: "QRコードアクション・流入計測",
        icon: faQrcode,
        intro: "流入経路ごとにQRコード／友だち追加リンクを発行し、どの経路から友だち追加されたかを計測します。追加時にタグ付与やステップ配信の開始などのアクションも自動実行できます。",
        steps: [
            {
                title: "前提: LIFF連携を済ませる",
                body: [
                    "流入計測（誰がどのQRから追加したか）には LIFF 連携が必須です。先に「LIFF設定」を完了してください。",
                ],
            },
            {
                title: "QRコードアクションを作成する",
                body: [
                    "サイドバーの「QRコードアクション」を開き、「新規作成」をクリックします。",
                    "新規作成モーダルで管理名（例: チラシ用 / Web用 / 名刺用 など）と稼働対象を入力し、「QRコードアクションの作成に進む」をクリックします。",
                    "計測したい流入経路ごとに1つずつ作成します。",
                ],
                tip: "稼働対象の「新規友だちのみ」は、初めて友だち追加した人だけにアクションを実行します（作成後は変更できません）。",
                images: [
                    {
                        src: "/images/guide/qr-01.png",
                        caption: "①「QRコードアクション」を開く",
                    },
                    {
                        src: "/images/guide/qr-02.png",
                        caption: "②「新規作成」をクリック",
                    },
                    {
                        src: "/images/guide/qr-03.png",
                        caption: "③ 管理名・稼働対象を入力して作成に進む",
                    },
                ],
            },
            {
                title: "追加時のアクションを設定する",
                body: [
                    "「読み込み時アクション」で、友だち追加時に実行するアクション（タグ付与・ステップ配信の開始・友だち情報の更新など）を設定します。",
                    "読み込み時に送るメッセージも登録できます。",
                    "設定できたら「保存」します。",
                ],
                tip: "流入経路ごとにタグを付けておくと、後からセグメント配信や分析がしやすくなります。",
                image: {
                    src: "/images/guide/qr-04.png",
                    caption: "「読み込み時アクション」でメッセージ・アクションを設定",
                },
            },
            {
                title: "QRコード／リンクを配布する",
                body: [
                    "一覧の「QRコードを表示」をクリックします。",
                    "表示された「アクションURL（QRコード）」のURLをコピー、またはQRコードをダウンロードして配布します。",
                    "チラシ・Webサイト・SNSなど、経路ごとに対応するQR/リンクを使い分けます。",
                ],
                images: [
                    {
                        src: "/images/guide/qr-05.png",
                        caption: "①「QRコードを表示」をクリック",
                    },
                    {
                        src: "/images/guide/qr-06.png",
                        caption: "② アクションURLをコピー、またはQRコードをダウンロード",
                    },
                ],
            },
            {
                title: "流入を計測する",
                body: [
                    "友だちがQRを読み取って追加すると、その経路の追加数としてカウントされます。",
                    "一覧の「データ詳細」を開くと、URL読み込み数・友だち追加数・アクション稼働数などを期間別に確認できます。",
                ],
                note: "計測が0のままの場合は、Webhook設定とLIFF設定（友だち追加オプションON）が完了しているか確認してください。いずれかが未設定だと追加イベントを捕捉できません。",
                images: [
                    {
                        src: "/images/guide/qr-07.png",
                        caption: "①「データ詳細」を開く",
                    },
                    {
                        src: "/images/guide/qr-08.png",
                        caption: "② 数値情報で流入を確認",
                    },
                ],
            },
        ],
    },
];

const TOPIC_IDS: TopicId[] = ["connection", "webhook", "liff", "qr"];

function isTopicId(value: string | null): value is TopicId {
    return value !== null && (TOPIC_IDS as string[]).includes(value);
}

export default function GuideIndex() {
    const searchParams = useSearchParams();
    const topicParam = searchParams.get("topic");
    const initialTopic: TopicId = isTopicId(topicParam) ? topicParam : "connection";

    const [active, setActive] = useState<TopicId>(initialTopic);

    const guide = GUIDES.find((g) => g.id === active) ?? GUIDES[0];

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">使い方ガイド</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    初期設定（接続・Webhook・LIFF・流入計測）の手順をまとめています。上から順に進めると、つまずかずに設定できます。
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
                {/* トピックナビ */}
                <aside className="rounded-lg border border-border p-3 self-start md:sticky md:top-4">
                    <div className="text-center text-sm font-bold text-muted-foreground pb-3 border-b border-border">
                        ガイド一覧
                    </div>
                    <div className="space-y-2 pt-3">
                        {GUIDES.map((g, i) => {
                            const isActive = g.id === active;
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setActive(g.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition-colors",
                                        isActive
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                                            : "border-border text-foreground hover:bg-muted/50",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                            isActive
                                                ? "bg-blue-500 text-white"
                                                : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {i + 1}
                                    </span>
                                    <FontAwesomeIcon
                                        icon={g.icon}
                                        className="size-3.5 shrink-0"
                                    />
                                    <span className="flex-1 min-w-0">{g.label}</span>
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className="size-3 shrink-0 opacity-60"
                                    />
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* 本文 */}
                <section className="min-w-0 space-y-5">
                    <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6 space-y-6">
                        <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <FontAwesomeIcon icon={guide.icon} className="size-5" />
                            </span>
                            <div>
                                <h2 className="text-lg font-bold">{guide.label}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {guide.intro}
                                </p>
                            </div>
                        </div>

                        <ol className="space-y-5">
                            {guide.steps.map((step, i) => (
                                <li
                                    key={i}
                                    className="flex gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0"
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <h3 className="text-sm font-bold">{step.title}</h3>
                                        {step.body.map((p, j) => (
                                            <p
                                                key={j}
                                                className="text-sm text-muted-foreground leading-relaxed"
                                            >
                                                {p}
                                            </p>
                                        ))}
                                        {(
                                            step.images ??
                                            (step.image ? [step.image] : [])
                                        ).map((img, k) => (
                                            <GuideImage key={k} image={img} />
                                        ))}
                                        {step.note && (
                                            <Callout
                                                icon={faTriangleExclamation}
                                                tone="warn"
                                            >
                                                {step.note}
                                            </Callout>
                                        )}
                                        {step.tip && (
                                            <Callout icon={faLightbulb} tone="tip">
                                                {step.tip}
                                            </Callout>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="flex items-start gap-2 rounded-md bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                        <FontAwesomeIcon
                            icon={faCircleInfo}
                            className="size-3.5 mt-0.5 shrink-0"
                        />
                        <span>
                            設定でつまずいた場合は、各ページ右上の「使い方ガイド」ボタンから該当する手順をすぐに確認できます。
                        </span>
                    </div>
                </section>
            </div>
        </div>
    );
}

/** スクリーンショット。画像が無い間はファイル名付きのプレースホルダを表示する。 */
function GuideImage({ image }: { image: StepImage }) {
    const [errored, setErrored] = useState(false);

    return (
        <figure className="mt-1 overflow-hidden rounded-lg border border-border">
            {errored ? (
                <div className="flex flex-col items-center justify-center gap-2 bg-muted/40 py-10 text-center text-xs text-muted-foreground">
                    <FontAwesomeIcon icon={faImage} className="size-6 opacity-60" />
                    <span>スクリーンショット準備中</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                        {image.src}
                    </code>
                </div>
            ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={image.src}
                    alt={image.caption ?? ""}
                    loading="lazy"
                    onError={() => setErrored(true)}
                    className="block w-full"
                />
            )}
            {image.caption && (
                <figcaption className="bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    {image.caption}
                </figcaption>
            )}
        </figure>
    );
}

function Callout({
    icon,
    tone,
    children,
}: {
    icon: IconDefinition;
    tone: "warn" | "tip";
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex items-start gap-2 rounded-md px-3 py-2 text-xs leading-relaxed",
                tone === "warn"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-300",
            )}
        >
            <FontAwesomeIcon icon={icon} className="size-3.5 mt-0.5 shrink-0" />
            <span>{children}</span>
        </div>
    );
}
