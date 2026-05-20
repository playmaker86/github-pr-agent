function divide(a: number, b: number) {
    if (b === 0) {
        throw new Error("除数不能为0")
    }
    return a / b;
}
