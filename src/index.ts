import { BasicTool } from "zotero-plugin-toolkit";
import Addon from "./addon";
import { config } from "../package.json";

const basicTool = new BasicTool();

if (!basicTool.getGlobal("Zotero")[config.addonInstance]) {
	defineGlobal("window");
	defineGlobal("document");
	defineGlobal("console");
	defineGlobal("performance");
	defineGlobal("ZoteroPane");
	defineGlobal("Zotero_Tabs");
	_globalThis.addon = new Addon();
	defineGlobal("ztoolkit", () => {
		return _globalThis.addon.data.ztoolkit;
	});
	Zotero[config.addonInstance] = addon;
	ztoolkit;
}

function defineGlobal(name: Parameters<BasicTool["getGlobal"]>[0]): void;
function defineGlobal(name: string, getter: () => any): void;
function defineGlobal(name: string, getter?: () => any) {
	Object.defineProperty(_globalThis, name, {
		get() {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return getter ? getter() : basicTool.getGlobal(name);
		},
	});
}
