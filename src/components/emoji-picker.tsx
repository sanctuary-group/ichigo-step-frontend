import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFaceSmile,
    faLeaf,
    faUtensils,
    faFutbol,
    faEarthAmericas,
    faLightbulb,
    faFlag,
    faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Emoji = { e: string; n: string };
type Category = {
    key: string;
    label: string;
    icon: typeof faFaceSmile;
    emojis: Emoji[];
};

const CATEGORIES: Category[] = [
    {
        key: "smileys",
        label: "Smileys & People",
        icon: faFaceSmile,
        emojis: [
            { e: "😀", n: "grin happy" },
            { e: "😃", n: "smile happy" },
            { e: "😄", n: "laugh happy" },
            { e: "😁", n: "beam grin" },
            { e: "😆", n: "laugh" },
            { e: "😅", n: "sweat laugh" },
            { e: "😂", n: "joy tears laugh" },
            { e: "🤣", n: "rofl rolling laugh" },
            { e: "😊", n: "blush smile" },
            { e: "😇", n: "angel innocent" },
            { e: "🙂", n: "slight smile" },
            { e: "🙃", n: "upside down" },
            { e: "😉", n: "wink" },
            { e: "😌", n: "relieved" },
            { e: "😍", n: "heart eyes love" },
            { e: "🥰", n: "love hearts" },
            { e: "😘", n: "kiss heart" },
            { e: "😗", n: "kiss" },
            { e: "😙", n: "kiss smile" },
            { e: "😚", n: "kiss closed" },
            { e: "😋", n: "yum tongue" },
            { e: "😛", n: "tongue" },
            { e: "😝", n: "tongue squint" },
            { e: "😜", n: "wink tongue" },
            { e: "🤪", n: "zany crazy" },
            { e: "🤨", n: "raised eyebrow" },
            { e: "🧐", n: "monocle" },
            { e: "🤓", n: "nerd glasses" },
            { e: "😎", n: "cool sunglasses" },
            { e: "🥳", n: "party" },
            { e: "🙄", n: "eye roll" },
            { e: "😏", n: "smirk" },
            { e: "😴", n: "sleep" },
            { e: "🤔", n: "thinking" },
            { e: "🤗", n: "hug" },
            { e: "😭", n: "cry sob" },
            { e: "😢", n: "cry tear" },
            { e: "😡", n: "angry rage" },
            { e: "😱", n: "scream fear" },
            { e: "👍", n: "thumbs up good" },
            { e: "👎", n: "thumbs down" },
            { e: "🙏", n: "pray thanks" },
            { e: "👏", n: "clap" },
            { e: "🙌", n: "raise hands" },
            { e: "💪", n: "muscle strong" },
            { e: "👋", n: "wave hello" },
            { e: "✌️", n: "peace victory" },
            { e: "🤝", n: "handshake" },
        ],
    },
    {
        key: "nature",
        label: "Animals & Nature",
        icon: faLeaf,
        emojis: [
            { e: "🐶", n: "dog" },
            { e: "🐱", n: "cat" },
            { e: "🐭", n: "mouse" },
            { e: "🐹", n: "hamster" },
            { e: "🐰", n: "rabbit" },
            { e: "🦊", n: "fox" },
            { e: "🐻", n: "bear" },
            { e: "🐼", n: "panda" },
            { e: "🐨", n: "koala" },
            { e: "🐯", n: "tiger" },
            { e: "🦁", n: "lion" },
            { e: "🐮", n: "cow" },
            { e: "🐷", n: "pig" },
            { e: "🐸", n: "frog" },
            { e: "🐵", n: "monkey" },
            { e: "🐔", n: "chicken" },
            { e: "🐧", n: "penguin" },
            { e: "🐦", n: "bird" },
            { e: "🦄", n: "unicorn" },
            { e: "🐝", n: "bee" },
            { e: "🦋", n: "butterfly" },
            { e: "🌸", n: "flower blossom" },
            { e: "🌹", n: "rose flower" },
            { e: "🌻", n: "sunflower" },
            { e: "🌷", n: "tulip" },
            { e: "🌲", n: "tree" },
            { e: "🌴", n: "palm tree" },
            { e: "🍀", n: "clover luck" },
            { e: "🍁", n: "maple leaf" },
            { e: "🌙", n: "moon" },
            { e: "⭐", n: "star" },
            { e: "🌟", n: "star glow" },
            { e: "🔥", n: "fire" },
            { e: "🌈", n: "rainbow" },
            { e: "☀️", n: "sun" },
            { e: "⛅", n: "cloud sun" },
            { e: "❄️", n: "snow" },
            { e: "💧", n: "water drop" },
        ],
    },
    {
        key: "food",
        label: "Food & Drink",
        icon: faUtensils,
        emojis: [
            { e: "🍎", n: "apple" },
            { e: "🍊", n: "orange" },
            { e: "🍋", n: "lemon" },
            { e: "🍌", n: "banana" },
            { e: "🍉", n: "watermelon" },
            { e: "🍇", n: "grapes" },
            { e: "🍓", n: "strawberry" },
            { e: "🍑", n: "peach" },
            { e: "🍒", n: "cherry" },
            { e: "🍅", n: "tomato" },
            { e: "🌽", n: "corn" },
            { e: "🍞", n: "bread" },
            { e: "🧀", n: "cheese" },
            { e: "🍔", n: "burger" },
            { e: "🍟", n: "fries" },
            { e: "🍕", n: "pizza" },
            { e: "🌭", n: "hotdog" },
            { e: "🍜", n: "ramen noodles" },
            { e: "🍣", n: "sushi" },
            { e: "🍱", n: "bento" },
            { e: "🍙", n: "rice ball" },
            { e: "🍰", n: "cake" },
            { e: "🎂", n: "birthday cake" },
            { e: "🍦", n: "ice cream" },
            { e: "🍩", n: "donut" },
            { e: "🍪", n: "cookie" },
            { e: "🍫", n: "chocolate" },
            { e: "🍬", n: "candy" },
            { e: "☕", n: "coffee" },
            { e: "🍵", n: "tea" },
            { e: "🍺", n: "beer" },
            { e: "🍷", n: "wine" },
            { e: "🥂", n: "cheers toast" },
        ],
    },
    {
        key: "activities",
        label: "Activities",
        icon: faFutbol,
        emojis: [
            { e: "⚽", n: "soccer" },
            { e: "🏀", n: "basketball" },
            { e: "🏈", n: "football" },
            { e: "⚾", n: "baseball" },
            { e: "🎾", n: "tennis" },
            { e: "🏐", n: "volleyball" },
            { e: "🏉", n: "rugby" },
            { e: "🎱", n: "billiards" },
            { e: "🏓", n: "ping pong" },
            { e: "🏸", n: "badminton" },
            { e: "🥅", n: "goal" },
            { e: "⛳", n: "golf" },
            { e: "🎣", n: "fishing" },
            { e: "🎿", n: "ski" },
            { e: "🏂", n: "snowboard" },
            { e: "🏊", n: "swim" },
            { e: "🚴", n: "cycling" },
            { e: "🏆", n: "trophy win" },
            { e: "🥇", n: "gold medal" },
            { e: "🎯", n: "target darts" },
            { e: "🎮", n: "game" },
            { e: "🎲", n: "dice" },
            { e: "🎸", n: "guitar" },
            { e: "🎤", n: "mic sing" },
            { e: "🎧", n: "headphones" },
            { e: "🎵", n: "music note" },
            { e: "🎉", n: "party popper" },
            { e: "🎊", n: "confetti" },
            { e: "🎁", n: "gift present" },
            { e: "🎈", n: "balloon" },
        ],
    },
    {
        key: "travel",
        label: "Travel & Places",
        icon: faEarthAmericas,
        emojis: [
            { e: "🚗", n: "car" },
            { e: "🚕", n: "taxi" },
            { e: "🚌", n: "bus" },
            { e: "🚙", n: "suv" },
            { e: "🚓", n: "police car" },
            { e: "🚑", n: "ambulance" },
            { e: "🚒", n: "fire truck" },
            { e: "🚲", n: "bike" },
            { e: "🛵", n: "scooter" },
            { e: "✈️", n: "plane" },
            { e: "🚀", n: "rocket" },
            { e: "🚁", n: "helicopter" },
            { e: "🚢", n: "ship" },
            { e: "⛵", n: "sailboat" },
            { e: "🚆", n: "train" },
            { e: "🗻", n: "mountain fuji" },
            { e: "🏔️", n: "mountain" },
            { e: "🏖️", n: "beach" },
            { e: "🏝️", n: "island" },
            { e: "🗼", n: "tower" },
            { e: "🗽", n: "statue liberty" },
            { e: "🏠", n: "house home" },
            { e: "🏢", n: "office building" },
            { e: "🏯", n: "castle japan" },
            { e: "⛩️", n: "shrine" },
            { e: "🌍", n: "earth globe" },
            { e: "🌏", n: "earth asia" },
            { e: "🗺️", n: "map" },
            { e: "🧭", n: "compass" },
        ],
    },
    {
        key: "objects",
        label: "Objects",
        icon: faLightbulb,
        emojis: [
            { e: "💡", n: "idea light bulb" },
            { e: "📱", n: "phone mobile" },
            { e: "💻", n: "laptop computer" },
            { e: "⌚", n: "watch" },
            { e: "📷", n: "camera" },
            { e: "🎥", n: "movie camera" },
            { e: "📺", n: "tv" },
            { e: "🔋", n: "battery" },
            { e: "🔌", n: "plug" },
            { e: "💰", n: "money bag" },
            { e: "💴", n: "yen" },
            { e: "💳", n: "credit card" },
            { e: "📦", n: "package box" },
            { e: "📨", n: "mail" },
            { e: "✉️", n: "envelope" },
            { e: "📅", n: "calendar" },
            { e: "📌", n: "pin" },
            { e: "📎", n: "clip" },
            { e: "✏️", n: "pencil" },
            { e: "🖊️", n: "pen" },
            { e: "📝", n: "memo note" },
            { e: "📖", n: "book" },
            { e: "🔑", n: "key" },
            { e: "🔒", n: "lock" },
            { e: "🔔", n: "bell" },
            { e: "⏰", n: "alarm clock" },
            { e: "🔍", n: "search magnify" },
            { e: "💊", n: "pill medicine" },
            { e: "🎀", n: "ribbon" },
        ],
    },
    {
        key: "symbols",
        label: "Symbols & Flags",
        icon: faFlag,
        emojis: [
            { e: "❤️", n: "red heart love" },
            { e: "🧡", n: "orange heart" },
            { e: "💛", n: "yellow heart" },
            { e: "💚", n: "green heart" },
            { e: "💙", n: "blue heart" },
            { e: "💜", n: "purple heart" },
            { e: "🖤", n: "black heart" },
            { e: "💕", n: "two hearts" },
            { e: "💖", n: "sparkle heart" },
            { e: "💗", n: "growing heart" },
            { e: "💔", n: "broken heart" },
            { e: "✨", n: "sparkles" },
            { e: "⭐", n: "star" },
            { e: "🌟", n: "glowing star" },
            { e: "💥", n: "boom" },
            { e: "💯", n: "100 hundred" },
            { e: "✅", n: "check mark" },
            { e: "❌", n: "cross x" },
            { e: "⭕", n: "circle" },
            { e: "❗", n: "exclamation" },
            { e: "❓", n: "question" },
            { e: "💬", n: "speech bubble" },
            { e: "🚩", n: "flag" },
            { e: "🏁", n: "checkered flag" },
            { e: "🎌", n: "japan flags" },
            { e: "🔴", n: "red circle" },
            { e: "🟢", n: "green circle" },
            { e: "🔵", n: "blue circle" },
        ],
    },
];

export function EmojiPicker({
    onSelect,
    compact = false,
}: {
    onSelect: (emoji: string) => void;
    compact?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [catIndex, setCatIndex] = useState(0);
    const [query, setQuery] = useState("");
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const q = query.trim().toLowerCase();
    const results = useMemo(() => {
        if (!q) return null;
        return CATEGORIES.flatMap((c) => c.emojis).filter((em) =>
            em.n.includes(q),
        );
    }, [q]);

    const activeCat = CATEGORIES[catIndex];

    return (
        <div ref={wrapRef} className="relative inline-block">
            {compact ? (
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="絵文字"
                >
                    <FontAwesomeIcon icon={faFaceSmile} className="size-4" />
                </button>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-blue-600 dark:text-blue-400"
                    onClick={() => setOpen((o) => !o)}
                >
                    <FontAwesomeIcon icon={faFaceSmile} className="size-3" />
                    絵文字
                </Button>
            )}

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-popover shadow-lg">
                    {/* カテゴリタブ */}
                    <div className="flex items-center justify-between border-b border-border px-1">
                        {CATEGORIES.map((c, i) => (
                            <button
                                key={c.key}
                                type="button"
                                onClick={() => {
                                    setCatIndex(i);
                                    setQuery("");
                                }}
                                title={c.label}
                                className={cn(
                                    "flex h-10 flex-1 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
                                    i === catIndex &&
                                        !q &&
                                        "border-b-2 border-primary text-foreground",
                                )}
                            >
                                <FontAwesomeIcon icon={c.icon} className="size-4" />
                            </button>
                        ))}
                    </div>

                    {/* 検索 */}
                    <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search emoji"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                            className="size-3.5 text-muted-foreground"
                        />
                    </div>

                    {/* グリッド */}
                    <div className="max-h-64 overflow-y-auto p-3">
                        {results ? (
                            results.length > 0 ? (
                                <EmojiGrid
                                    emojis={results}
                                    onPick={(e) => {
                                        onSelect(e);
                                        setOpen(false);
                                    }}
                                />
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    該当する絵文字がありません
                                </p>
                            )
                        ) : (
                            <>
                                <p className="mb-2 text-base font-bold">
                                    {activeCat.label}
                                </p>
                                <EmojiGrid
                                    emojis={activeCat.emojis}
                                    onPick={(e) => {
                                        onSelect(e);
                                        setOpen(false);
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function EmojiGrid({
    emojis,
    onPick,
}: {
    emojis: Emoji[];
    onPick: (emoji: string) => void;
}) {
    return (
        <div className="grid grid-cols-5 gap-1">
            {emojis.map((em, i) => (
                <button
                    key={`${em.e}-${i}`}
                    type="button"
                    onClick={() => onPick(em.e)}
                    className="flex h-10 items-center justify-center rounded text-2xl transition-colors hover:bg-muted"
                    title={em.n}
                >
                    {em.e}
                </button>
            ))}
        </div>
    );
}
