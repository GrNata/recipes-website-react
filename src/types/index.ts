// import {n} from "vite/dist/node/chunks/moduleRunnerTransport";

export type RecipeStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

// 'ROle_USER'
export type Role = 'USER' | 'MODERATOR' | 'ADMIN';

// --- USER

export interface User {
    id: number;
    username: string;
    email: string;
    registrationDate: string;
    lastLoginAt: string | null;
    roles: string[];
    blocked: boolean;
}

// --- RECIPE

export interface RecipeAuthor {
    id: number;
    username: string;
}

export interface CategoryValueDto {
    id: number;
    typeId: number;
    typeName: string;
    categoryValue: string;
}

export interface UnitDto {
    id: number | null;
    code: string;
    label: string;
}

export interface IngredientWithAmountDto {
    id: number | null;
    name: string;
    nameEng: string | null;
    energyKcal100g: number | null;
    amount: string | null;
    unit: UnitDto;
}

export interface RecipeDto {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    createdAt: string;
    publishedAt: string | null;
    status: RecipeStatus;
    author: RecipeAuthor;
    baseServings: number;
    categoryValues: Record<string, CategoryValueDto>;   // Map<String, CategoryValueDto> в TypeScript описывается через Record
    ingredients: IngredientWithAmountDto[]; // List<IngredientWithAmountDto>
    steps: string[];    // List<String> - список шагов
    totalCalories: number | null;
}

//  --- АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    username: string;
    email: string;
}

export interface RegisterResponse {
    email: string;
    username: string;
}

//  ---

export interface IngredientDto {
    id: number;
    name: string;
    nameEnglish: string | null;
    energyKcal100g: number | null;
}

