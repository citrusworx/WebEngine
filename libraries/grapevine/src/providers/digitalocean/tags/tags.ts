import axios from "axios";
import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { cleanPayload } from "../utilities.js";

// Tags DO

export async function listAllTags(){}

export async function listTag(){}

export async function createTag(tag: string){}

export async function tagResource(tag: string){}

export async function deleteTag(tag: string){}

export async function untagResource(resource: string){}