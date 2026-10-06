import { buildFilter } from "../utils/query.js"
import assert from "assert";

let passed = 0;
function test(nom, fn){
    fn();
    passed += 1;
    console.log(`ok ${nom}`);
}


test("min est converit en nombre", ()=>{
    const filter = buildFilter({min: "25"});
    assert.strictEqual(typeof filter.value.$gte, "number");
});

console.log(`\n${passed} tests reussis\n`);