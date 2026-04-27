export const registerMap: Record<string, number> = {
  $zero: 0,
  $0: 0,
  $at: 1,
  $1: 1,
  $v0: 2,
  $2: 2,
  $v1: 3,
  $3: 3,
  $a0: 4,
  $4: 4,
  $a1: 5,
  $5: 5,
  $a2: 6,
  $6: 6,
  $a3: 7,
  $7: 7,
  $t0: 8,
  $8: 8,
  $t1: 9,
  $9: 9,
  $t2: 10,
  $10: 10,
  $t3: 11,
  $11: 11,
  $t4: 12,
  $12: 12,
  $t5: 13,
  $13: 13,
  $t6: 14,
  $14: 14,
  $t7: 15,
  $15: 15,
  $s0: 16,
  $16: 16,
  $s1: 17,
  $17: 17,
  $s2: 18,
  $18: 18,
  $s3: 19,
  $19: 19,
  $s4: 20,
  $20: 20,
  $s5: 21,
  $21: 21,
  $s6: 22,
  $22: 22,
  $s7: 23,
  $23: 23,
  $t8: 24,
  $24: 24,
  $t9: 25,
  $25: 25,
  $k0: 26,
  $26: 26,
  $k1: 27,
  $27: 27,
  $gp: 28,
  $28: 28,
  $sp: 29,
  $29: 29,
  $fp: 30,
  $30: 30,
  $ra: 31,
  $31: 31,
};

export const registerNames = [
  "$zero",
  "$at",
  "$v0",
  "$v1",
  "$a0",
  "$a1",
  "$a2",
  "$a3",
  "$t0",
  "$t1",
  "$t2",
  "$t3",
  "$t4",
  "$t5",
  "$t6",
  "$t7",
  "$s0",
  "$s1",
  "$s2",
  "$s3",
  "$s4",
  "$s5",
  "$s6",
  "$s7",
  "$t8",
  "$t9",
  "$k0",
  "$k1",
  "$gp",
  "$sp",
  "$fp",
  "$ra",
  "HI",
  "LO",
];

export function toBinary(num: number, length: number) {
  let bin = (num >>> 0).toString(2);
  while (bin.length < length) {
    bin = "0" + bin;
  }
  return bin.slice(-length);
}

export const R_TYPE_MNEMONICS = [
  "add",
  "sub",
  "mult",
  "div",
  "and",
  "or",
  "sll",
  "slt",
  "syscall",
  "jr",
  "mflo",
  "mfhi",
];
export const I_TYPE_MNEMONICS = [
  "addi",
  "slti",
  "ori",
  "lw",
  "sw",
  "lui",
  "beq",
  "bne",
];
export const J_TYPE_MNEMONICS = ["j", "jal"];

export function formatBinary(binary: string, mnemonic: string) {
  if (binary.length !== 32) return binary;
  if (R_TYPE_MNEMONICS.includes(mnemonic)) {
    return `${binary.slice(0, 6)} ${binary.slice(6, 11)} ${binary.slice(11, 16)} ${binary.slice(16, 21)} ${binary.slice(21, 26)} ${binary.slice(26, 32)}`;
  }
  if (I_TYPE_MNEMONICS.includes(mnemonic)) {
    return `${binary.slice(0, 6)} ${binary.slice(6, 11)} ${binary.slice(11, 16)} ${binary.slice(16, 32)}`;
  }
  if (J_TYPE_MNEMONICS.includes(mnemonic)) {
    return `${binary.slice(0, 6)} ${binary.slice(6, 32)}`;
  }
  return binary;
}

export const initialRegisters = () => {
  const regs: Record<string, number> = {};
  registerNames.forEach((name) => {
    regs[name] = 0;
  });
  regs["$sp"] = 0x7fffeffc; // Typical MIPS stack pointer
  return regs;
};

export interface Instruction {
  text: string;
  binary: string;
  mnemonic: string;
  args: string[];
  address: number;
  originalLine: number;
}

export interface AssembleResult {
  instructions: Instruction[];
  memory: Record<number, number>;
  labels: Record<string, number>;
  error?: string;
}

export function readWord(
  memory: Record<number, number>,
  address: number,
): number {
  const b0 = memory[address] || 0;
  const b1 = memory[address + 1] || 0;
  const b2 = memory[address + 2] || 0;
  const b3 = memory[address + 3] || 0;
  return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
}

export function writeWord(
  memory: Record<number, number>,
  address: number,
  value: number,
) {
  memory[address] = (value >>> 24) & 0xff;
  memory[address + 1] = (value >>> 16) & 0xff;
  memory[address + 2] = (value >>> 8) & 0xff;
  memory[address + 3] = value & 0xff;
}
