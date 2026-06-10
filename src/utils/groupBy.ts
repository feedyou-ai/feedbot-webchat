// @ts-nocheck Got no patience for this ancient version of TypeScript
import { getDeepValue } from './getDeepValue';

export function groupBy<T extends object>(items: T[], prop: string): { [key: string]: T[] } {
    return items.reduce((groups: { [key: string]: T[] }, item: T) => {
        const key = getDeepValue(item, prop);
        if (key == null) return groups;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}
