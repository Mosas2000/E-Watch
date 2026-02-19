import { describe, it, expect } from "vitest";
import {
  getActiveContract,
  getContractByVersion,
  V1_CONTRACT,
  V2_CONTRACT,
  CONTRACT_VERSION,
} from "../src/config/contractConfig";

/**
 * Contract configuration module tests.
 * Validates address constants, version switching logic,
 * and helper function behavior.
 */

describe("contractConfig :: constants", () => {
  it("v1 contract has correct address", () => {
    expect(V1_CONTRACT.address).toBe(
      "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T"
    );
  });

  it("v1 contract name is ewatch", () => {
    expect(V1_CONTRACT.name).toBe("ewatch");
  });

  it("v1 contract version is 1", () => {
    expect(V1_CONTRACT.version).toBe(1);
  });

  it("v2 contract has correct address", () => {
    expect(V2_CONTRACT.address).toBe(
      "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T"
    );
  });

  it("v2 contract name is ewatch-v2", () => {
    expect(V2_CONTRACT.name).toBe("ewatch-v2");
  });

  it("v2 contract version is 2", () => {
    expect(V2_CONTRACT.version).toBe(2);
  });

  it("both contracts share the same deployer address", () => {
    expect(V1_CONTRACT.address).toBe(V2_CONTRACT.address);
  });
});

describe("contractConfig :: getActiveContract", () => {
  it("returns an object with address, name, and version", () => {
    const contract = getActiveContract();
    expect(contract).toHaveProperty("address");
    expect(contract).toHaveProperty("name");
    expect(contract).toHaveProperty("version");
  });

  it("active contract matches CONTRACT_VERSION", () => {
    const contract = getActiveContract();
    expect(contract.version).toBe(CONTRACT_VERSION);
  });
});

describe("contractConfig :: getContractByVersion", () => {
  it("returns v1 config when passed 1", () => {
    const contract = getContractByVersion(1);
    expect(contract.name).toBe("ewatch");
    expect(contract.version).toBe(1);
  });

  it("returns v2 config when passed 2", () => {
    const contract = getContractByVersion(2);
    expect(contract.name).toBe("ewatch-v2");
    expect(contract.version).toBe(2);
  });

  it("v1 and v2 configs have different names", () => {
    const v1 = getContractByVersion(1);
    const v2 = getContractByVersion(2);
    expect(v1.name).not.toBe(v2.name);
  });

  it("v1 and v2 configs have different versions", () => {
    const v1 = getContractByVersion(1);
    const v2 = getContractByVersion(2);
    expect(v1.version).not.toBe(v2.version);
  });
});
