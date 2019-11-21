export class Helper {
  static async runAsync<T, U = Error>(promise: Promise<T>): Promise<[U | null, T | null]> {
    return promise
      .then<[null, T]>((data: T) => [null, data])
      .catch<[U, null]>(err => [err, null]);
  }
}
