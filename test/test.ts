import * as mocha from 'mocha';
import * as grb from '../src/grb';
import { expect } from 'chai';

describe('reflected object', () => {
    it('should be able to have properties added to it', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        ctx.addListener((event) => evts.push(event));

        obj.x = 5;

        expect(evts).to.deep.equal([
            { kind: 'set', field: 'x', value: 5 },
        ]);
    });

    it('should allow modifications to the object', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        obj.x = 5;
        obj.x = 10;
        cancel_listener();

        expect(evts).to.deep.equal([
            { kind: 'set', field: 'x', value: 5 },
            { kind: 'set', field: 'x', value: 10 },
        ]);
    });

    it('should support converting deep object', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        obj.x = { a: 10, b: 30 };
        cancel_listener();
        const x_id = grb.getIdentifier(obj.x);

        expect(evts).to.deep.equal([
            { kind: 'new-obj', id: x_id },
            { kind: 'set', field: 'a', value: 10},
            { kind: 'set', field: 'b', value: 30},
            { kind: 'set', field: 'x', value: { a: 10, b: 30}},
        ]);
    });

    it('should support converting deep object with shared pointers', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        const o = { a: 10, b: 30 };
        const n = { o1: o, o2: o };
        obj.n = n;
        cancel_listener();

        const n_id = grb.getIdentifier(obj.n);
        const o_id = grb.getIdentifier(obj.n.o1);

        expect(evts).to.deep.equal([
            { "kind": "new-obj", id: n_id},
            { "kind": "new-obj", id: o_id},
            { "field": "a", "kind": "set", "value": 10, },
            { "field": "b", "kind": "set", "value": 30, },
            { "field": "o1", "kind": "set", "value": { "a": 10, "b": 30, }, },
            { "field": "o2", "kind": "set", "value": { "a": 10, "b": 30, }, },
            { "field": "n", "kind": "set", "value": { "o1": { "a": 10, "b": 30, }, "o2": { "a": 10, "b": 30, }, }, }
        ]);
    });

    it('should support modifying those deep objects', () => {
        const [ctx, obj] = grb.room();

        const o = { a: 10, b: 30 };
        // Shared reference into `o`
        const n = { o1: o, o2: o };

        obj.x = n;
        obj.x.o1.a = 100;

        expect(obj).to.deep.equal({
            x: {
                o1: { a: 100, b: 30 },
                o2: { a: 100, b: 30 },
            }
        });
    });

    it('should reuse already assimilated objects', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        obj.x = {a: 10, b: 20};
        obj.y = obj.x

        cancel_listener();

        const x_id = grb.getIdentifier(obj.x);

        expect(evts).to.deep.equal([
            { "kind": "new-obj", id: x_id },
            { "field": "a", "kind": "set", "value": 10, },
            { "field": "b", "kind": "set", "value": 20, },
            { "field": "x", "kind": "set", "value": { "a": 10, "b": 20, } },
            { "field": "x", "kind": "get", "success": true, },
            { "field": "y", "kind": "set", "value": { "a": 10, "b": 20, } }
        ]);
    });

    it('should reuse already assimilated objects and pass mutations through', () => {
        const [ctx, obj] = grb.room();

        obj.x = {a: 10, b: 20};
        obj.y = obj.x
        obj.x.a = 300;

        expect(obj.x.a).to.equal(obj.y.a);
    });
});