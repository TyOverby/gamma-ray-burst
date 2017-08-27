import * as grb from "./src/grb";

let [ctx, r] = grb.room();

r.x = { a: 10, b: 15 };
r.x.b = 20;
console.log(r);
