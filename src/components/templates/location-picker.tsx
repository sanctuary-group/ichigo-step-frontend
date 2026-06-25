import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faSpinner } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Leaflet 既定アイコンは bundler でパスが解決できないため CDN を使う
const MARKER_ICON = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [35.681236, 139.767125]; // 東京駅
const MAX = 90;

export type LocationValue = {
    latitude: number | null;
    longitude: number | null;
    title: string;
    address: string;
};

async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ja`,
            { headers: { Accept: "application/json" } },
        );
        const data = await res.json();
        return (data?.display_name as string) ?? "";
    } catch {
        return "";
    }
}

async function geocode(
    query: string,
): Promise<{ lat: number; lon: number; label: string } | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
                query,
            )}&accept-language=ja&limit=1`,
            { headers: { Accept: "application/json" } },
        );
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
            return {
                lat: Number(data[0].lat),
                lon: Number(data[0].lon),
                label: data[0].display_name as string,
            };
        }
        return null;
    } catch {
        return null;
    }
}

export function LocationPicker({
    value,
    onChange,
}: {
    value: LocationValue;
    onChange: (patch: Partial<LocationValue>) => void;
}) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapObj = useRef<L.Map | null>(null);
    const markerObj = useRef<L.Marker | null>(null);

    // 地図上で選択中（未決定）のピン
    const [pendingLat, setPendingLat] = useState<number | null>(
        value.latitude,
    );
    const [pendingLng, setPendingLng] = useState<number | null>(
        value.longitude,
    );
    const [pendingAddress, setPendingAddress] = useState<string>(
        value.latitude != null ? value.address : "",
    );
    const [search, setSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const [resolving, setResolving] = useState(false);

    const placePin = async (lat: number, lon: number) => {
        setPendingLat(lat);
        setPendingLng(lon);
        const marker = markerObj.current;
        if (marker) marker.setLatLng([lat, lon]);
        setResolving(true);
        const addr = await reverseGeocode(lat, lon);
        setPendingAddress(addr);
        setResolving(false);
    };

    // 地図初期化（一度だけ）
    useEffect(() => {
        if (!mapRef.current || mapObj.current) return;
        const start: [number, number] =
            value.latitude != null && value.longitude != null
                ? [value.latitude, value.longitude]
                : DEFAULT_CENTER;
        const map = L.map(mapRef.current).setView(start, 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);
        const marker = L.marker(start, {
            icon: MARKER_ICON,
            draggable: true,
        }).addTo(map);
        marker.on("dragend", () => {
            const p = marker.getLatLng();
            void placePin(p.lat, p.lng);
        });
        map.on("click", (e: L.LeafletMouseEvent) => {
            void placePin(e.latlng.lat, e.latlng.lng);
        });
        mapObj.current = map;
        markerObj.current = marker;
        // タイルのレイアウト崩れ対策
        setTimeout(() => map.invalidateSize(), 100);
        return () => {
            map.remove();
            mapObj.current = null;
            markerObj.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const runSearch = async () => {
        if (!search.trim()) return;
        setSearching(true);
        const r = await geocode(search.trim());
        setSearching(false);
        if (r && mapObj.current) {
            mapObj.current.setView([r.lat, r.lon], 16);
            setPendingLat(r.lat);
            setPendingLng(r.lon);
            setPendingAddress(r.label);
            markerObj.current?.setLatLng([r.lat, r.lon]);
        }
    };

    const commit = () => {
        if (pendingLat == null || pendingLng == null) return;
        onChange({
            latitude: pendingLat,
            longitude: pendingLng,
            // タイトル未入力ならピンの住所を初期タイトルに
            ...(value.title ? {} : { title: pendingAddress.split(",")[0] }),
        });
    };

    return (
        <div className="space-y-6">
            {/* 位置情報選択 */}
            <div className="rounded-md border border-border p-4 space-y-3">
                <p className="text-base font-bold">位置情報選択</p>
                <p className="text-sm text-muted-foreground">
                    ① 送信したい位置情報を地図上でクリックしてピンの位置を設定してください。
                </p>

                <div className="relative">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                void runSearch();
                            }
                        }}
                        placeholder="ピンの位置を住所で指定する"
                        className="h-10"
                    />
                    {searching && (
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="absolute right-3 top-3 size-4 text-muted-foreground"
                        />
                    )}
                </div>

                <div
                    ref={mapRef}
                    className="h-[420px] w-full rounded-md border border-border z-0"
                />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-sm text-muted-foreground">
                        ② 送信する位置情報を決定する
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pendingLat == null}
                        onClick={commit}
                        className="text-primary border-primary/40"
                    >
                        <FontAwesomeIcon
                            icon={faLocationDot}
                            className="size-3.5"
                        />
                        選択されているピンの位置で決定
                    </Button>
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">指定された住所</p>
                    <div className="min-h-10 rounded-md bg-muted/40 px-3 py-2 text-sm">
                        {resolving ? (
                            <span className="text-muted-foreground">
                                住所を取得中...
                            </span>
                        ) : (
                            pendingAddress || (
                                <span className="text-muted-foreground">
                                    地図をクリックしてください
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* 送信情報 */}
            <div className="rounded-md border border-border p-4 space-y-4">
                <p className="text-base font-bold">送信情報</p>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* プレビュー */}
                    <LocationPreview
                        latitude={value.latitude}
                        longitude={value.longitude}
                        title={value.title}
                        address={value.address}
                    />

                    {/* 入力 */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold">
                                    位置情報タイトル
                                </label>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {value.title.length}/{MAX}
                                </span>
                            </div>
                            <Input
                                value={value.title}
                                maxLength={MAX}
                                onChange={(e) =>
                                    onChange({ title: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold">
                                    位置情報詳細
                                </label>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {value.address.length}/{MAX}
                                </span>
                            </div>
                            <Input
                                value={value.address}
                                maxLength={MAX}
                                onChange={(e) =>
                                    onChange({ address: e.target.value })
                                }
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!pendingAddress}
                            onClick={() =>
                                onChange({
                                    address: pendingAddress.slice(0, MAX),
                                })
                            }
                        >
                            送信する位置情報の住所を引用
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LocationPreview({
    latitude,
    longitude,
    title,
    address,
}: {
    latitude: number | null;
    longitude: number | null;
    title: string;
    address: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const mapObj = useRef<L.Map | null>(null);
    const markerObj = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!ref.current || latitude == null || longitude == null) return;
        if (!mapObj.current) {
            const map = L.map(ref.current, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                attributionControl: false,
            }).setView([latitude, longitude], 15);
            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                { maxZoom: 19 },
            ).addTo(map);
            markerObj.current = L.marker([latitude, longitude], {
                icon: MARKER_ICON,
            }).addTo(map);
            mapObj.current = map;
            setTimeout(() => map.invalidateSize(), 100);
        } else {
            mapObj.current.setView([latitude, longitude], 15);
            markerObj.current?.setLatLng([latitude, longitude]);
        }
        return () => {
            mapObj.current?.remove();
            mapObj.current = null;
            markerObj.current = null;
        };
    }, [latitude, longitude]);

    return (
        <div className="max-w-xs overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            {latitude != null && longitude != null ? (
                <div ref={ref} className="h-40 w-full z-0" />
            ) : (
                <div className="flex h-40 w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
                    ピンを決定するとプレビューが表示されます
                </div>
            )}
            <div className="divide-y divide-border border-t border-border">
                <div className="px-3 py-2 text-sm font-bold">
                    {title || (
                        <span className="text-destructive">位置情報タイトル</span>
                    )}
                </div>
                <div className="px-3 py-2 text-sm">
                    {address || (
                        <span className="text-destructive">位置情報詳細</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 text-xs text-primary">
                <FontAwesomeIcon icon={faLocationDot} className="size-3" />
                Location
            </div>
        </div>
    );
}
