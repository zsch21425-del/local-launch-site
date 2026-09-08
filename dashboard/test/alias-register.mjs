// Registers the "@/" -> "src/" resolver hook for the smoke test run.
import { register } from "node:module";

register("./alias-resolve.mjs", import.meta.url);
