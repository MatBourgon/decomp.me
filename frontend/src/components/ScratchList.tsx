"use client";

import { type JSX, type ReactNode, useState } from "react";

import Link from "@/components/Link";

import clsx from "clsx";

import AsyncButton from "./AsyncButton";
import Button from "./Button";
import styles from "./ScratchList.module.scss";
import { type TerseScratch, usePaginated } from "@/lib/api";
import { scratchUrl } from "@/lib/api/urls";
import { ScratchItem } from "./ScratchItem";
import Sort, { SortMode } from "./SortScratch";
import { TextSkeleton, SCRATCH_LIST } from "./TextSkeleton";
import Checkbox from "@/app/(navfooter)/settings/Checkbox";
import * as api from "@/lib/api";
import { TrashIcon } from "@primer/octicons-react";

export interface Props {
    title?: string;
    url?: string;
    className?: string;
    item?: ({ scratch }: { scratch: TerseScratch }) => JSX.Element;
    emptyButtonLabel?: ReactNode;
    isSortable?: boolean;
    isPublic?: boolean;
    canManage?: boolean;
}

function useDeleteSelectedScratches(results: Map<string, [TerseScratch, boolean]>): Promise<void> {
    return new Promise(async (res) => {
        const filteredList = results.values().filter((value: [TerseScratch, boolean]) => {
            return value[1];
        })?.toArray() || [];

        if (filteredList.length === 0) {
            alert("Select at least one scratch to delete.");
        } else if (
            confirm(
                `Are you sure you want to delete ${filteredList.length == 1 ? "1 scratch" : filteredList.length.toLocaleString() + " scratches"}? This action cannot be undone.`,
            )
        ) {
            for(const [scratch, markedForDelete] of filteredList) {
                if (markedForDelete) {
                    await api.delete_(scratchUrl(scratch), {});
                }
            }
            window.location.reload();
        }
        res();
    });
}

export default function ScratchList({
    title,
    url,
    className,
    item,
    emptyButtonLabel,
    isSortable,
    isPublic,
    canManage
}: Props) {
    const [sortMode, setSortMode] = useState(SortMode.NEWEST_FIRST);
    const [viewManage, setViewManage] = useState(false);
    const { results, isLoading, hasNext, loadNext } =
        usePaginated<TerseScratch>(
            `${url || "/scratch"}&ordering=${sortMode.toString()}`,
            { isPublic },
        );

    const Item = item || ScratchItem;
    const scratchItems: Map<string, [TerseScratch, boolean]> = new Map<string, [TerseScratch, boolean]>();

    const subscribeItem = (scratch: TerseScratch, markedForDelete: boolean) => {
        if (scratch && scratch.slug)
        {
            const entry = scratchItems.get(scratch.slug);
            if (entry === undefined)
            {
                scratchItems.set(scratch.slug, [scratch, markedForDelete]);
            }
            else if (entry[1] !== markedForDelete)
            {
                entry[1] = markedForDelete;
            }
        }
    };

    return (
        <>
            <div className="flex justify-between pb-2">
                {canManage && (
                    <div className={clsx(styles["checkbox-manage"])}>
                        <Checkbox
                            checked={viewManage}
                            onChange={setViewManage}
                            label="Manage your scratches"
                        ></Checkbox>
                    </div>
                )}
                <h2 className="font-medium text-lg tracking-tight">{title}</h2>
                {isSortable && (
                    <Sort sortMode={sortMode} setSortMode={setSortMode} />
                )}
            </div>
            {results.length === 0 && isLoading ? (
                <TextSkeleton text={SCRATCH_LIST} />
            ) : (
                <ul
                    className={clsx(
                        styles.list,
                        "rounded-md border-gray-6 text-sm",
                        className,
                    )}
                >
                    {results.map((scratch) => (
                        <Item key={scratchUrl(scratch)} scratch={scratch} canManage={viewManage} subscribeItem={subscribeItem} />
                    ))}
                    {results.length === 0 && emptyButtonLabel && (
                        <li className={styles.button}>
                            <Link href="/new">
                                <Button>{emptyButtonLabel}</Button>
                            </Link>
                        </li>
                    )}
                    <div className={clsx(styles["button-container"])}>
                        {viewManage && (
                            <li className={clsx(styles.button)}>
                                <AsyncButton onClick={() => {return useDeleteSelectedScratches(scratchItems)}}>
                                    <TrashIcon/> Delete selected scratches
                                </AsyncButton>
                            </li>
                        )}
                        {hasNext && (
                            <li className={styles.button}>
                                <AsyncButton onClick={loadNext}>
                                    Show more
                                </AsyncButton>
                            </li>
                        )}
                    </div>
                </ul>
            )}
        </>
    );
}
