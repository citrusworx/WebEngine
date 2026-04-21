import axios from "axios";
import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { cleanPayload } from "../utilities.js";

export interface DomainReponse {
    per_page?: number;
    page?: number;
}

// Domain Management
// 
// 

export async function listAllDomains(){}

export async function listExistingDomain(){}

export async function createDomain(){}

export async function deleteDomain(domain: string){}

// DNS
// 
// 

export async function listAllDomainRecords(){}

export async function createDomainRecord(){}

export async function listExistingDomainRecord(){}

export async function updateDomainRecord(){}

export async function deleteDomainRecord(){}