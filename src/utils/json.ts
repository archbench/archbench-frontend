export function safeParse<T = any>(json : string): T | null {
    try{
        return JSON.parse(json) as T;
    }catch{
        return null;
    }
}