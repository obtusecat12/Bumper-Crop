/* @ts-self-types="./ntsc_rs_web_wrapper.d.ts" */

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5}
 */
export const DescriptorKind = Object.freeze({
    Enumeration: 0, "0": "Enumeration",
    Percentage: 1, "1": "Percentage",
    IntRange: 2, "2": "IntRange",
    FloatRange: 3, "3": "FloatRange",
    Boolean: 4, "4": "Boolean",
    Group: 5, "5": "Group",
});

export class EffectOutput {
    static __wrap(ptr) {
        const obj = Object.create(EffectOutput.prototype);
        obj.__wbg_ptr = ptr;
        EffectOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EffectOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_effectoutput_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get height() {
        const ret = wasm.__wbg_get_effectoutput_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get len() {
        const ret = wasm.__wbg_get_effectoutput_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get ptr() {
        const ret = wasm.__wbg_get_effectoutput_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_effectoutput_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set height(arg0) {
        wasm.__wbg_set_effectoutput_height(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set len(arg0) {
        wasm.__wbg_set_effectoutput_len(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set ptr(arg0) {
        wasm.__wbg_set_effectoutput_ptr(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_effectoutput_width(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) EffectOutput.prototype[Symbol.dispose] = EffectOutput.prototype.free;

export class NtscConfigurator {
    static __wrap(ptr) {
        const obj = Object.create(NtscConfigurator.prototype);
        obj.__wbg_ptr = ptr;
        NtscConfiguratorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NtscConfiguratorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ntscconfigurator_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.ntscconfigurator_new();
        this.__wbg_ptr = ret;
        NtscConfiguratorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) NtscConfigurator.prototype[Symbol.dispose] = NtscConfigurator.prototype.free;

export class NtscEffectBuf {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NtscEffectBufFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ntsceffectbuf_free(ptr, 0);
    }
    /**
     * Apply the effect in-place on the contents of the source buffer, writing to and returning
     * the destination buffer.
     *
     * Pipeline: input -> [resize] -> [rotate] -> [effect] -> output.
     * Each optional step writes to its own intermediate buffer; the final result always ends up
     * in `self.effect_dst`.
     * @param {number} frame_num
     * @param {number} resize_width
     * @param {number} resize_height
     * @param {ResizeFilter} resize_filter
     * @param {boolean} pad_to_even
     * @param {boolean} effect_enabled
     * @param {Rotation} rotation
     * @param {number} rect_top
     * @param {number} rect_right
     * @param {number} rect_bottom
     * @param {number} rect_left
     * @returns {EffectOutput}
     */
    applyEffect(frame_num, resize_width, resize_height, resize_filter, pad_to_even, effect_enabled, rotation, rect_top, rect_right, rect_bottom, rect_left) {
        const ret = wasm.ntsceffectbuf_applyEffect(this.__wbg_ptr, frame_num, resize_width, resize_height, resize_filter, pad_to_even, effect_enabled, rotation, rect_top, rect_right, rect_bottom, rect_left);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return EffectOutput.__wrap(ret[0]);
    }
    /**
     * Get a pointer to the input/source buffer. This is what the effect will read from, and what you should write to.
     * @param {number} width
     * @param {number} height
     * @returns {Uint8Array}
     */
    inputBuffer(width, height) {
        const ret = wasm.ntsceffectbuf_inputBuffer(this.__wbg_ptr, width, height);
        return ret;
    }
    constructor() {
        const ret = wasm.ntsceffectbuf_new();
        this.__wbg_ptr = ret;
        NtscEffectBufFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Update the effect settings.
     * @param {NtscConfigurator} settings
     */
    setEffectSettings(settings) {
        _assertClass(settings, NtscConfigurator);
        var ptr0 = settings.__destroy_into_raw();
        wasm.ntsceffectbuf_setEffectSettings(this.__wbg_ptr, ptr0);
    }
}
if (Symbol.dispose) NtscEffectBuf.prototype[Symbol.dispose] = NtscEffectBuf.prototype.free;

export class NtscSettingsList {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NtscSettingsListFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ntscsettingslist_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    defaultPreset() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.ntscsettingslist_defaultPreset(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    getSettingsList() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.ntscsettingslist_getSettingsList(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    constructor() {
        const ret = wasm.ntscsettingslist_new();
        this.__wbg_ptr = ret;
        NtscSettingsListFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} json
     * @returns {string}
     */
    parsePreset(json) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.ntscsettingslist_parsePreset(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @param {string} json
     * @returns {NtscConfigurator}
     */
    settingsFromJSON(json) {
        const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ntscsettingslist_settingsFromJSON(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return NtscConfigurator.__wrap(ret[0]);
    }
}
if (Symbol.dispose) NtscSettingsList.prototype[Symbol.dispose] = NtscSettingsList.prototype.free;

/**
 * @enum {0 | 1 | 2}
 */
export const ResizeFilter = Object.freeze({
    Nearest: 0, "0": "Nearest",
    Bilinear: 1, "1": "Bilinear",
    Bicubic: 2, "2": "Bicubic",
});

/**
 * @enum {0 | 1 | 2 | 3}
 */
export const Rotation = Object.freeze({
    None: 0, "0": "None",
    Cw90: 1, "1": "Cw90",
    Cw180: 2, "2": "Cw180",
    Cw270: 3, "3": "Cw270",
});

/**
 * @param {Function} callback
 */
export function setPanicHook(callback) {
    wasm.setPanicHook(callback);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_5d9e815e6fdf150f: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_6bcf8d3e20937e46: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbindgen_generic_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./ntsc_rs_web_wrapper_bg.js": import0,
    };
}

const EffectOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_effectoutput_free(ptr, 1));
const NtscConfiguratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ntscconfigurator_free(ptr, 1));
const NtscEffectBufFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ntsceffectbuf_free(ptr, 1));
const NtscSettingsListFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ntscsettingslist_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }


    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
