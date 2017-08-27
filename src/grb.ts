import { Context, Identifier, isTracked, getIdentifier, Value, createIdentifier } from './context';
import { proxy_object, IdentifierOrValue } from './object';
export { Value, ProxyEvent, getIdentifier } from './context';

export function room(): [Context, any] {
    const context = new Context();
    var [_, assimilated_obj] = assimilate_top(context, {});
    return [context, assimilated_obj]
}

export function assimilate_object(context: Context, o: any, visited: Map<any, any>): [Identifier, any] {
    const sym = createIdentifier();

    function ass_this(ctx: Context, value: any): [IdentifierOrValue, any] {
        return assimilate_bot(ctx, value, visited);
    }

    let object = proxy_object(context, ass_this, sym);

    for (const k in o) {
        object[k] = o[k];
    }

    context.mapping.set(sym, object);
    return [sym, object];
}

export function assimilate_bot(
    context: Context,
    value: any,
    visited: Map<any, [IdentifierOrValue, any]>): [IdentifierOrValue, any] {

    const alreadyVisited = visited.get(value);
    if (alreadyVisited !== undefined) {
        return alreadyVisited;
    }

    if (isTracked(value)) {
        const identifier: IdentifierOrValue = {
            type: 'identifier',
            id: getIdentifier(value),
        };
        return [identifier, value]
    }

    if (typeof value === 'object') {
        const res = assimilate_object(context, value, visited);
        const res_mod: [IdentifierOrValue, any] = [
            { type: 'identifier', id: res[0], },
            res[1]
        ];
        visited.set(value, res_mod);
        return res_mod;
    }

    return [
        { type: 'value', value: value },
        value];
}

export function assimilate_top(context: Context, value: any): [IdentifierOrValue, any] {
    const visited = new Map();
    return assimilate_bot(context, value, visited);
}
