export type MockChannel = {
  id: string;
  name: string;
  basicId: string;
  pictureUrl?: string;
};

export type MockUser = {
  id: string;
  name: string;
  email: string;
};

export type MockTag = {
  id: string;
  name: string;
  color: string; // tailwind-ish hex
  folderId?: string;
  actionLabel?: string;
  capacity?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MockTagFolder = {
  id: string;
  name: string;
  isSystem?: boolean;
};

export type MockFriend = {
  id: string;
  channelId: string;
  displayName: string;
  systemDisplayName?: string;
  email?: string;
  pictureUrl?: string;
  isFollowing: boolean;
  isHidden?: boolean;
  followedAt: string;
  source: string; // 流入経路
  tagIds: string[];
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
  scenarioId?: string;
  scenarioStepLabel?: string;
};

export type MockMessageType = "text" | "image" | "flex" | "sticker";

export type MockMessage = {
  id: string;
  friendId: string;
  direction: "incoming" | "outgoing";
  type: MockMessageType;
  content: string; // text body or image url or label
  timestamp: string;
  source?: "user" | "broadcast" | "scenario" | "manual";
};

export type MockBroadcast = {
  id: string;
  title: string;
  messageType: MockMessageType;
  preview: string;
  targetType: "all" | "tag";
  targetTagId?: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  totalCount: number;
  successCount: number;
};

export type MockScenarioStep = {
  id: string;
  order: number;
  delayMinutes: number;
  messageType: MockMessageType;
  preview: string;
};

export type MockScenarioFolder = {
  id: string;
  name: string;
  isSystem?: boolean;
};

export type MockScenario = {
  id: string;
  name: string;
  description?: string;
  triggerType: "friend_add" | "tag_added" | "manual";
  triggerTagId?: string;
  isActive: boolean;
  enrolledCount: number;
  terminatedCount: number;
  completedCount: number;
  folderId: string;
  steps: MockScenarioStep[];
};

export const MOCK_SCENARIO_FOLDERS: MockScenarioFolder[] = [
  { id: "sfld_default", name: "未分類", isSystem: true },
  { id: "sfld_welcome", name: "ウェルカム" },
  { id: "sfld_event", name: "イベント" },
  { id: "sfld_vip", name: "VIP" },
];

export const MOCK_CHANNELS: MockChannel[] = [
  { id: "ch_1", name: "ichigo-step 公式LINE", basicId: "@ichigo-step" },
  { id: "ch_2", name: "サブアカウント (テスト)", basicId: "@ichigo-step-test" },
];

export const MOCK_CURRENT_USER: MockUser = {
  id: "u_1",
  name: "Ryu Ichigo",
  email: "ryu.ichigo20250310@gmail.com",
};

export const MOCK_TAG_FOLDERS: MockTagFolder[] = [
  { id: "tagf_default", name: "未分類", isSystem: true },
];

export const MOCK_TAGS: MockTag[] = [];

export const MOCK_FRIENDS: MockFriend[] = [
  {
    id: "f_1",
    channelId: "ch_1",
    displayName: "佐竹 輝夫",
    isFollowing: true,
    followedAt: "2026-05-12T10:00:00+09:00",
    source: "QR広告A",
    tagIds: ["tag_vip", "tag_customer"],
    lastMessagePreview: "ありがとうございます！助かりました。",
    lastMessageAt: "2026-05-25T08:32:00+09:00",
    unreadCount: 0,
  },
  {
    id: "f_2",
    channelId: "ch_1",
    displayName: "あみ",
    isFollowing: true,
    followedAt: "2026-05-21T22:04:00+09:00",
    source: "通常友だち追加",
    tagIds: ["tag_lead"],
    lastMessagePreview: "30秒アンケートで無料プレゼント!!",
    lastMessageAt: "2026-05-21T22:04:00+09:00",
    unreadCount: 2,
    scenarioId: "sc_welcome",
    scenarioStepLabel: "Welcome Step 2/4",
  },
  {
    id: "f_3",
    channelId: "ch_1",
    displayName: "NANA",
    isFollowing: true,
    followedAt: "2026-05-21T15:00:00+09:00",
    source: "LP A",
    tagIds: ["tag_event"],
    lastMessagePreview: "SHINさん🍀 アンケート完了しました！",
    lastMessageAt: "2026-05-21T15:00:00+09:00",
    unreadCount: 0,
  },
  {
    id: "f_4",
    channelId: "ch_1",
    displayName: "よし",
    isFollowing: true,
    followedAt: "2026-05-20T09:00:00+09:00",
    source: "Instagram",
    tagIds: ["tag_lead", "tag_event"],
    lastMessagePreview: "美波に相談したい🌸",
    lastMessageAt: "2026-05-20T20:11:00+09:00",
    unreadCount: 1,
  },
  {
    id: "f_5",
    channelId: "ch_1",
    displayName: "Rio",
    isFollowing: true,
    followedAt: "2026-05-19T11:30:00+09:00",
    source: "ワンステップスタジオ流入",
    tagIds: ["tag_customer"],
    lastMessagePreview: "ワンステップスタジオの件…",
    lastMessageAt: "2026-05-20T17:50:00+09:00",
    unreadCount: 0,
  },
  {
    id: "f_6",
    channelId: "ch_1",
    displayName: "強",
    isFollowing: true,
    followedAt: "2026-05-20T07:00:00+09:00",
    source: "QR広告B",
    tagIds: ["tag_lead"],
    lastMessagePreview: "強さん🍀 アンケート…",
    lastMessageAt: "2026-05-20T19:00:00+09:00",
    unreadCount: 3,
  },
  {
    id: "f_7",
    channelId: "ch_1",
    displayName: "イルゴ",
    isFollowing: true,
    followedAt: "2026-05-18T13:00:00+09:00",
    source: "YouTube概要欄",
    tagIds: ["tag_cold"],
    lastMessagePreview: "また連絡します。",
    lastMessageAt: "2026-05-18T14:00:00+09:00",
    unreadCount: 1,
  },
  {
    id: "f_8",
    channelId: "ch_1",
    displayName: "Maki",
    isFollowing: false,
    followedAt: "2026-04-10T09:00:00+09:00",
    source: "Twitter",
    tagIds: ["tag_cold"],
    lastMessagePreview: "(ブロック済み)",
    lastMessageAt: "2026-05-01T10:00:00+09:00",
    unreadCount: 0,
  },
];

export const MOCK_MESSAGES: MockMessage[] = [
  // f_2 あみ のチャット
  {
    id: "m_1",
    friendId: "f_2",
    direction: "outgoing",
    type: "text",
    content:
      "皆さまとの会話や\nここだけで話せる情報共有を\n\n個別にしてきたいと思っています🌸\n\n私のプライベートや\n日常的な配信もたまにしているので\n\nぜひあみさんのお話も\n気軽に聞かせて下さい(｡ơᴗơ｡)\n\nこれからよろしくお願いしますね🍀",
    timestamp: "2026-05-21T22:05:00+09:00",
    source: "scenario",
  },
  {
    id: "m_2",
    friendId: "f_2",
    direction: "outgoing",
    type: "image",
    content: "30秒アンケートで無料プレゼント!!",
    timestamp: "2026-05-21T22:06:00+09:00",
    source: "scenario",
  },
  {
    id: "m_3",
    friendId: "f_2",
    direction: "outgoing",
    type: "text",
    content:
      "無料特典を受け取るための\n30秒アンケートはこちらです🌸\n↓↓↓\nhttps://liff.line.me/2009495547-lwGYs2Hw?unique_key=2Tyck8t-177374\n\n回答後すぐに\n特典が受け取れます🌸",
    timestamp: "2026-05-21T22:07:00+09:00",
    source: "scenario",
  },
  {
    id: "m_4",
    friendId: "f_2",
    direction: "incoming",
    type: "text",
    content: "ありがとうございます！受け取ります🍀",
    timestamp: "2026-05-21T22:15:00+09:00",
  },
  // f_1 佐竹 輝夫 のチャット
  {
    id: "m_5",
    friendId: "f_1",
    direction: "incoming",
    type: "text",
    content: "先日はありがとうございました。",
    timestamp: "2026-05-25T08:30:00+09:00",
  },
  {
    id: "m_6",
    friendId: "f_1",
    direction: "outgoing",
    type: "text",
    content: "こちらこそ、お力になれて何よりです！",
    timestamp: "2026-05-25T08:31:00+09:00",
    source: "manual",
  },
  {
    id: "m_7",
    friendId: "f_1",
    direction: "incoming",
    type: "text",
    content: "ありがとうございます！助かりました。",
    timestamp: "2026-05-25T08:32:00+09:00",
  },
];

export const MOCK_BROADCASTS: MockBroadcast[] = [
  {
    id: "b_1",
    title: "5月末セールのお知らせ",
    messageType: "text",
    preview: "本日23:59まで限定30%OFF！",
    targetType: "all",
    status: "sent",
    sentAt: "2026-05-25T10:00:00+09:00",
    createdAt: "2026-05-24T09:00:00+09:00",
    updatedAt: "2026-05-25T09:55:00+09:00",
    totalCount: 1248,
    successCount: 1240,
  },
  {
    id: "b_2",
    title: "VIP向け新商品案内",
    messageType: "flex",
    preview: "[Flex] 新商品 - VIP先行",
    targetType: "tag",
    targetTagId: "tag_vip",
    status: "scheduled",
    scheduledAt: "2026-05-26T09:00:00+09:00",
    createdAt: "2026-05-23T14:00:00+09:00",
    updatedAt: "2026-05-24T11:00:00+09:00",
    totalCount: 56,
    successCount: 0,
  },
  {
    id: "b_3",
    title: "アンケートご協力のお願い",
    messageType: "text",
    preview: "30秒で完了するアンケートに...",
    targetType: "tag",
    targetTagId: "tag_lead",
    status: "draft",
    scheduledAt: "2026-05-30T10:00:00+09:00",
    createdAt: "2026-05-22T16:00:00+09:00",
    updatedAt: "2026-05-24T18:00:00+09:00",
    totalCount: 0,
    successCount: 0,
  },
  {
    id: "b_4",
    title: "イベント直前リマインダー",
    messageType: "text",
    preview: "明日13:00開始です",
    targetType: "tag",
    targetTagId: "tag_event",
    status: "sent",
    sentAt: "2026-05-22T18:00:00+09:00",
    createdAt: "2026-05-21T10:00:00+09:00",
    updatedAt: "2026-05-22T17:30:00+09:00",
    totalCount: 142,
    successCount: 141,
  },
  {
    id: "b_5",
    title: "送信失敗テスト",
    messageType: "image",
    preview: "[Image] キャンペーンバナー",
    targetType: "all",
    status: "failed",
    sentAt: "2026-05-20T12:00:00+09:00",
    createdAt: "2026-05-19T15:00:00+09:00",
    updatedAt: "2026-05-20T11:50:00+09:00",
    totalCount: 1200,
    successCount: 230,
  },
];

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: "sc_welcome",
    name: "新規友だちウェルカム",
    description: "友だち追加から4日間で計4通の自動配信",
    triggerType: "friend_add",
    isActive: true,
    enrolledCount: 312,
    terminatedCount: 24,
    completedCount: 892,
    folderId: "sfld_welcome",
    steps: [
      {
        id: "ss_1",
        order: 1,
        delayMinutes: 0,
        messageType: "text",
        preview: "ご登録ありがとうございます！自己紹介です…",
      },
      {
        id: "ss_2",
        order: 2,
        delayMinutes: 60,
        messageType: "image",
        preview: "[Image] 30秒アンケート特典",
      },
      {
        id: "ss_3",
        order: 3,
        delayMinutes: 1440,
        messageType: "text",
        preview: "24時間後フォローアップメッセージ",
      },
      {
        id: "ss_4",
        order: 4,
        delayMinutes: 4320,
        messageType: "flex",
        preview: "[Flex] 3日後オファー",
      },
    ],
  },
  {
    id: "sc_event",
    name: "イベント参加者向けフォロー",
    description: "イベント参加タグが付いたら開始",
    triggerType: "tag_added",
    triggerTagId: "tag_event",
    isActive: true,
    enrolledCount: 84,
    terminatedCount: 8,
    completedCount: 156,
    folderId: "sfld_event",
    steps: [
      {
        id: "se_1",
        order: 1,
        delayMinutes: 0,
        messageType: "text",
        preview: "イベントへの参加表明ありがとうございます",
      },
      {
        id: "se_2",
        order: 2,
        delayMinutes: 60 * 24,
        messageType: "text",
        preview: "明日の持ち物リスト",
      },
    ],
  },
  {
    id: "sc_vip",
    name: "VIP昇格 オンボーディング",
    description: "VIP タグが付与されたお客様向け",
    triggerType: "tag_added",
    triggerTagId: "tag_vip",
    isActive: false,
    enrolledCount: 0,
    terminatedCount: 0,
    completedCount: 0,
    folderId: "sfld_vip",
    steps: [
      {
        id: "sv_1",
        order: 1,
        delayMinutes: 0,
        messageType: "flex",
        preview: "[Flex] VIP特典のご案内",
      },
    ],
  },
];

// ---- 拡張モック（L Message 風サイドバー追加機能） ----

export type MockTemplateFolder = {
  id: string;
  name: string;
  isSystem?: boolean; // "未分類" 等は削除不可
};

export type MockTemplate = {
  id: string;
  name: string;
  folderId: string;
  messageType: MockMessageType;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

export type MockRichMenu = {
  id: string;
  name: string;
  folderId: string;
  layout: "6grid" | "3vertical" | "4square";
  isPublished: boolean;
  publishedAt?: string;
  channelId: string;
  tapAreas: { label: string; action: string }[];
  createdAt: string;
  updatedAt: string;
};

export type MockRichMenuFolder = {
  id: string;
  name: string;
  isSystem?: boolean;
};

export type MockForm = {
  id: string;
  name: string;
  folderId: string;
  formType: "標準" | "予約" | "アンケート";
  distributionUrl: string;
  status: "draft" | "published" | "closed";
  questionCount: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MockFormFolder = {
  id: string;
  name: string;
  isSystem?: boolean;
};

export type MockAutoReply = {
  id: string;
  folderId: string;
  triggerType: "keyword" | "follow" | "default";
  keyword: string;
  schedule: string;
  replyPreview: string;
  hitCount: number;
  isActive: boolean;
  createdAt: string;
};

export type MockAutoReplyFolder = {
  id: string;
  name: string;
  isSystem?: boolean;
};

export type MockQrAction = {
  id: string;
  name: string;
  folderId: string;
  isActive: boolean;
  audience: string;
  action: "add_tag" | "start_scenario" | "track_source";
  actionLabel: string;
  scanCount: number;
  followCount: number;
  createdAt: string;
};

export type MockQrActionFolder = {
  id: string;
  name: string;
  isSystem?: boolean;
};

export type MockGreeting = {
  isActive: boolean;
  messageType: MockMessageType;
  content: string;
};

export type MockChatStatus = {
  id: string;
  name: string;
  color: string; // hex
};

export type MockSendShortcut = {
  id: string;
  keyword: string;
  reply: string;
};

export type MockFriendFieldFolder = {
  id: string;
  name: string;
  isSystem?: boolean;
};

export type MockFriendField = {
  id: string;
  name: string;
  folderId: string;
  fieldType: string;
  answerCount: number;
  createdAt: string;
};

export const MOCK_FRIEND_FIELD_FOLDERS: MockFriendFieldFolder[] = [
  { id: "fff_default", name: "未分類", isSystem: true },
  { id: "fff_basic", name: "基本情報" },
  { id: "fff_address", name: "国内住所" },
];

export const MOCK_FRIEND_FIELDS: MockFriendField[] = [
  { id: "ff_b1", name: "氏名", folderId: "fff_basic", fieldType: "テキスト", answerCount: 128, createdAt: "2026-04-01T10:00:00+09:00" },
  { id: "ff_b2", name: "電話番号", folderId: "fff_basic", fieldType: "電話番号", answerCount: 92, createdAt: "2026-04-01T10:00:00+09:00" },
  { id: "ff_b3", name: "メールアドレス", folderId: "fff_basic", fieldType: "メール", answerCount: 78, createdAt: "2026-04-02T10:00:00+09:00" },
  { id: "ff_b4", name: "生年月日", folderId: "fff_basic", fieldType: "日付", answerCount: 56, createdAt: "2026-04-03T10:00:00+09:00" },
  { id: "ff_a1", name: "郵便番号", folderId: "fff_address", fieldType: "テキスト", answerCount: 64, createdAt: "2026-04-10T10:00:00+09:00" },
  { id: "ff_a2", name: "都道府県", folderId: "fff_address", fieldType: "選択肢", answerCount: 64, createdAt: "2026-04-10T10:00:00+09:00" },
  { id: "ff_a3", name: "市区町村", folderId: "fff_address", fieldType: "テキスト", answerCount: 62, createdAt: "2026-04-10T10:00:00+09:00" },
  { id: "ff_a4", name: "番地・建物名", folderId: "fff_address", fieldType: "テキスト", answerCount: 60, createdAt: "2026-04-11T10:00:00+09:00" },
  { id: "ff_a5", name: "電話番号（自宅）", folderId: "fff_address", fieldType: "電話番号", answerCount: 24, createdAt: "2026-04-12T10:00:00+09:00" },
];

export const MOCK_CHAT_STATUSES: MockChatStatus[] = [
  { id: "cs_1", name: "見込みあり", color: "#f59e0b" },
  { id: "cs_2", name: "対応中", color: "#3b82f6" },
  { id: "cs_3", name: "フォロー", color: "#10b981" },
  { id: "cs_4", name: "トラブル", color: "#ef4444" },
  { id: "cs_5", name: "対応完了", color: "#6b7280" },
];

export const MOCK_SEND_SHORTCUTS: MockSendShortcut[] = [
  {
    id: "sh_1",
    keyword: "/thanks",
    reply: "お問い合わせありがとうございます🍀",
  },
  {
    id: "sh_2",
    keyword: "/hours",
    reply: "営業時間: 平日 10:00 - 19:00 / 土日祝 休業",
  },
  {
    id: "sh_3",
    keyword: "/access",
    reply: "アクセス: 東京都渋谷区... (Google Maps: https://...)",
  },
  {
    id: "sh_4",
    keyword: "/holiday",
    reply: "本日は休業日です。翌営業日に対応いたします。",
  },
];

export const MOCK_TEMPLATE_FOLDERS: MockTemplateFolder[] = [
  { id: "fld_default", name: "未分類", isSystem: true },
  { id: "fld_greeting", name: "挨拶メッセージ" },
  { id: "fld_announce", name: "案内" },
  { id: "fld_followup", name: "フォロー" },
];

export const MOCK_TEMPLATES: MockTemplate[] = [
  {
    id: "tpl_1",
    name: "新規友だちあいさつ",
    folderId: "fld_greeting",
    messageType: "text",
    preview: "ご登録ありがとうございます！🍀 こちらでは…",
    createdAt: "2026-04-10T09:00:00+09:00",
    updatedAt: "2026-05-24T10:00:00+09:00",
  },
  {
    id: "tpl_2",
    name: "セール告知（汎用）",
    folderId: "fld_announce",
    messageType: "text",
    preview: "本日23:59まで限定30%OFFセール！…",
    createdAt: "2026-03-15T11:00:00+09:00",
    updatedAt: "2026-05-25T10:00:00+09:00",
  },
  {
    id: "tpl_3",
    name: "アンケートご協力のお願い",
    folderId: "fld_announce",
    messageType: "text",
    preview: "30秒で完了する簡単なアンケートに…",
    createdAt: "2026-04-22T14:00:00+09:00",
    updatedAt: "2026-05-22T14:00:00+09:00",
  },
  {
    id: "tpl_4",
    name: "VIP先行案内（Flex）",
    folderId: "fld_announce",
    messageType: "flex",
    preview: "[Flex] VIP限定 新商品先行ご案内",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-05-18T09:00:00+09:00",
  },
  {
    id: "tpl_5",
    name: "1週間フォローアップ",
    folderId: "fld_followup",
    messageType: "text",
    preview: "ご登録から1週間が経ちました。お困り事は…",
    createdAt: "2026-05-20T16:00:00+09:00",
    updatedAt: "2026-05-20T16:00:00+09:00",
  },
];

export const MOCK_RICH_MENU_FOLDERS: MockRichMenuFolder[] = [
  { id: "rmf_default", name: "未分類", isSystem: true },
];

export const MOCK_RICH_MENUS: MockRichMenu[] = [];

export const MOCK_FORM_FOLDERS: MockFormFolder[] = [
  { id: "fmf_default", name: "未分類", isSystem: true },
];

export const MOCK_FORMS: MockForm[] = [];

export const MOCK_AUTO_REPLY_FOLDERS: MockAutoReplyFolder[] = [
  { id: "arf_default", name: "未分類", isSystem: true },
];

export const MOCK_AUTO_REPLIES: MockAutoReply[] = [];

export const MOCK_QR_ACTION_FOLDERS: MockQrActionFolder[] = [
  { id: "qrf_default", name: "未分類", isSystem: true },
];

export const MOCK_QR_ACTIONS: MockQrAction[] = [];

export const MOCK_GREETING: MockGreeting = {
  isActive: true,
  messageType: "text",
  content:
    "はじめまして！ご登録ありがとうございます🌸\n\nこのアカウントでは\n・お得なキャンペーン\n・新商品のお知らせ\n・限定クーポン\n\nなどをお届けしていきます🍀\n\nまずは下のメニューから\nお気軽にお問い合わせください！",
};

export function getFriend(id: string): MockFriend | undefined {
  return MOCK_FRIENDS.find((f) => f.id === id);
}

export function getTag(id: string): MockTag | undefined {
  return MOCK_TAGS.find((t) => t.id === id);
}

export function getMessagesByFriend(friendId: string): MockMessage[] {
  return MOCK_MESSAGES.filter((m) => m.friendId === friendId).sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
}

export function getScenarioById(id?: string): MockScenario | undefined {
  if (!id) return undefined;
  return MOCK_SCENARIOS.find((s) => s.id === id);
}
