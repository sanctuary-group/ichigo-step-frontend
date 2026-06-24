import {
  faCommentDots,
  faClipboard,
  faPaperPlane,
  faStairs,
  faUserPlus,
  faUserCheck,
  faUserSlash,
  faTableCells,
  faRectangleList,
  faRobot,
  faQrcode,
  faDatabase,
  faGear,
  faListCheck,
  faTag,
  faAddressCard,
  faUsers,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type NavItem = {
  label: string;
  href: string;
  icon: IconDefinition;
  badge?: number;
  children?: NavItem[];
};

export type NavGroup = {
  heading: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "メッセージ関連",
    items: [
      {
        label: "1:1 チャット",
        href: "/chat",
        icon: faCommentDots,
        badge: 7,
        children: [
          { label: "1:1チャット", href: "/chat", icon: faCommentDots },
          { label: "チャット設定", href: "/chat/settings", icon: faGear },
          {
            label: "チャット管理",
            href: "/chat/management",
            icon: faListCheck,
          },
        ],
      },
      { label: "テンプレート", href: "/templates", icon: faClipboard },
      { label: "メッセージ配信", href: "/broadcasts", icon: faPaperPlane },
      { label: "ステップ配信", href: "/scenarios", icon: faStairs },
      {
        label: "あいさつメッセージ",
        href: "/greetings",
        icon: faUserPlus,
        children: [
          { label: "新規友だち用", href: "/greetings", icon: faUserPlus },
          {
            label: "既存友だち用",
            href: "/greetings/existing",
            icon: faUserCheck,
          },
          {
            label: "ブロック解除友だち用",
            href: "/greetings/unblock",
            icon: faUserSlash,
          },
        ],
      },
    ],
  },
  {
    heading: "よく使われる機能",
    items: [
      { label: "リッチメニュー", href: "/rich-menus", icon: faTableCells },
      { label: "フォーム作成", href: "/forms", icon: faRectangleList },
      { label: "自動応答", href: "/auto-replies", icon: faRobot },
      { label: "QRコードアクション", href: "/qr-actions", icon: faQrcode },
      {
        label: "データ管理",
        href: "/data-management",
        icon: faDatabase,
        children: [
          { label: "タグ管理", href: "/tags", icon: faTag },
          {
            label: "友だち情報管理",
            href: "/data-management/friend-fields",
            icon: faAddressCard,
          },
          { label: "友だちリスト", href: "/friends", icon: faUsers },
          {
            label: "CSV管理",
            href: "/data-management/csv",
            icon: faFileCsv,
          },
        ],
      },
    ],
  },
];
