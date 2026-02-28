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

export interface CategoryTypeDto {
    id: number;
    nameType: string;
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
    cookingTimeMinutes: number | null;
    categoryValues: Record<string, CategoryValueDto>;   // Map<String, CategoryValueDto> в TypeScript описывается через Record
    ingredients: IngredientWithAmountDto[]; // List<IngredientWithAmountDto>
    steps: string[];    // List<String> - список шагов
    totalCalories: number | null;

    averageRating: number;
    ratingCount: number;
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
    // nameEng: string | null;
    energyKcal100g: number | null;
}

// ----- Status
const RecipeStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
} as const;

// Update create Recipe
export interface RecipeIngredientRequest {
    ingredientId: number,
    amound: string,
    unitId: number
}

export interface CreateRecipeRequest {
    name: string,
    description: string,
    image: string | null,
    baseServings: number,
    cookingTimeMinutes: number | null,
    categoryValueIds: number[],
    ingredients: RecipeIngredientRequest[],
    steps: string[]
}

export interface UpdateRecipeRequest {
    id: number,
    name: string,
    description: string | null,
    createdAt: string,
    publishedAt: string | null,
    status: RecipeStatus,
    author: RecipeAuthor,
    baseServings: number,
    cookingTimeMinutes: number | null,
    categoryIds: number[] | null,
    ingredients: RecipeIngredientRequest[] | null,
    steps: string[],
    totalCalories: number | null
}

// ADMIN
export interface UserDto {
    id: number;
    username: string;
    email: string;
    roles: string[];
    registrationDate: string;
    lastLoginAt: string;
    blocked: boolean;
}

export interface UpdateUserRoleRequest {
    roles: string[]
}

export interface BlockUserRequest {
    blocked: boolean
}

// СТАТИСТИКА
export interface Statistics {
    totalUsers: number;
    totalRecipes: number;
    totalIngredients: number;
    popularCategoriesValue: CategoryStateValue[];
    topAuthors: AuthorStars[];
}

export interface CategoryStateValue {
    categoryValueName: string;
    recipeCount: number;
}

export interface AuthorStars {
    authorId: number;
    username: string;
    recipeCount: number;
}

// ИНГРЕДИЕНТЫ
export interface IngredientRequest {
    id: number;
    name: string;
    nameEng: string | null;
    energyKcal100g: number | null;
}


// ------ ОБРАЩЕНИЯ ---------
    export type FeedbackTopic = 'INGREDIENT' | 'CATEGORY' | 'BUG' | 'IDEA' | 'COMPLAINT' | 'OTHER';

    export type FeedbackStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

    export interface FeedbackResponse {
        id: number;
        email: string;
        topic: FeedbackTopic;
        message: string;
        status: FeedbackStatus;
        createdAt: string;
    }

    export interface FeedbackRequest {
        email: string;
        topic: FeedbackTopic;
        message: string;
    }
// ----------------------------------


