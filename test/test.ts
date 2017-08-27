import * as mocha from 'mocha';
import * as grb from '../src/grb';
import { expect } from 'chai';

function raw_val(v: number | string): grb.IdentifierOrValue {
    return {
        type: 'value',
        value: v
    }
}

function id_val(v: grb.Identifier): grb.IdentifierOrValue {
    return {
        type: 'identifier',
        id: v
    }
}

describe('reflected object', () => {
    it('should be able to have properties added to it', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        obj.x = 5;
        cancel_listener();

        const obj_id = grb.getIdentifier(obj);

        expect(evts).to.deep.equal([
            { kind: 'set', field: 'x', value: raw_val(5), id: obj_id },
        ]);
    });

    it('should allow modifications to the object', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        obj.x = 5;
        obj.x = 10;
        cancel_listener();

        const obj_id = grb.getIdentifier(obj);

        expect(evts).to.deep.equal([
            { kind: 'set', field: 'x', value: raw_val(5), id: obj_id },
            { kind: 'set', field: 'x', value: raw_val(10), id: obj_id },
        ]);
    });

    it('should support converting deep object', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        obj.x = { a: 10, b: 30 };
        cancel_listener();

        const x_id = grb.getIdentifier(obj.x);
        const obj_id = grb.getIdentifier(obj);

        expect(evts).to.deep.equal([
            { kind: 'new-obj', id: x_id },
            { kind: 'set', field: 'a', value: raw_val(10), id: x_id },
            { kind: 'set', field: 'b', value: raw_val(30), id: x_id },
            { kind: 'set', field: 'x', value: id_val(x_id), id: obj_id },
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
        const obj_id = grb.getIdentifier(obj);

        expect(evts).to.deep.equal([
            { kind: "new-obj", id: n_id },
            { kind: "new-obj", id: o_id },
            { field: "a",  kind: "set", value: raw_val(10), id: o_id },
            { field: "b",  kind: "set", value: raw_val(30), id: o_id, },
            { field: "o1", kind: "set", value: id_val(o_id), id: n_id },
            { field: "o2", kind: "set", value: id_val(o_id), id: n_id },
            { field: "n",  kind: "set", value: id_val(n_id), id: obj_id }
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
        const obj_id = grb.getIdentifier(obj);

        expect(evts).to.deep.equal([
            { kind: "new-obj", id: x_id },
            { field: "a", kind: "set", value: raw_val(10), id: x_id },
            { field: "b", kind: "set", value: raw_val(20), id: x_id },
            { field: "x", kind: "set", value: id_val(x_id), id: obj_id },
            { field: "x", kind: "get", success: true, id: obj_id },
            { field: "y", kind: "set", value: id_val(x_id), id: obj_id }
        ]);
    });

    it('should reuse already assimilated objects and pass mutations through', () => {
        const [ctx, obj] = grb.room();

        obj.x = { a: 10, b: 20 };
        obj.y = obj.x
        obj.x.a = 300;

        expect(obj.x.a).to.equal(obj.y.a);
        expect(obj.x.a).to.equal(300);
        expect(obj.y.a).to.equal(300);
    });

    it('should delete fields successfully', () => {
        const [ctx, obj] = grb.room();
        const evts: grb.ProxyEvent[] = [];
        const cancel_listener = ctx.addListener((event) => evts.push(event));

        obj.x = 5;
        delete obj.x;

        cancel_listener();
        const obj_id = grb.getIdentifier(obj);

        expect(obj.x).to.be.equal(undefined);

        expect(evts).to.be.deep.equal([
            { kind: "set", id: obj_id, field: 'x', value: raw_val(5) },
            { kind: "delete", id: obj_id, field: 'x', success: true},
        ])
    });
});
