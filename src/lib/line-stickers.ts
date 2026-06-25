// Messaging API で送信できる LINE 公式スタンプのカタログ。
// クリエイターズスタンプは送信不可のため、公式パッケージのみを収録する。
// 参考: https://developers.line.biz/ja/docs/messaging-api/sticker-list/

export type StickerPackage = {
    packageId: number;
    name: string;
    stickerIds: number[];
};

// [packageId, 名称, 先頭stickerId, 個数] から連番で展開する
const PACKAGE_DEFS: [number, string, number, number][] = [
    [446, "ブラウン・コニー", 1988, 40],
    [789, "サリースペシャル", 10855, 40],
    [1070, "ムーンスペシャル", 17839, 40],
    [6136, "謝罪のプロ！LINEキャラクターズ", 10551376, 24],
    [6325, "ちっちゃいブラコニ", 10979904, 24],
    [6359, "ゆる敬語★LINEキャラクターズ", 11069848, 24],
    [6362, "動くブラウン＆コニー＆サリースペシャル", 11087920, 24],
    [6370, "ムーン・ジェームズ", 11088016, 24],
    [6632, "チェリーココ", 11825374, 24],
    [8515, "デカ絵文字", 16581242, 24],
    [8522, "ユニバースターBT21スペシャルVer.", 16581266, 24],
    [8525, "動くチョコ＆LINEキャラスペシャル", 16581290, 24],
    [11537, "ブラウン＆コニー＆サリー（動く）", 52002734, 40],
    [11538, "チョコ＆フレンズ（動く）", 51626494, 40],
    [11539, "UNIVERSTAR BT21（動く）", 52114110, 40],
];

export const STICKER_PACKAGES: StickerPackage[] = PACKAGE_DEFS.map(
    ([packageId, name, first, count]) => ({
        packageId,
        name,
        stickerIds: Array.from({ length: count }, (_, i) => first + i),
    }),
);

export function stickerImageUrl(stickerId: number): string {
    // iPhone/sticker.png は 0 バイトのことがあるため android パスを使う
    return `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;
}

export function findPackage(packageId: number): StickerPackage | undefined {
    return STICKER_PACKAGES.find((p) => p.packageId === packageId);
}
