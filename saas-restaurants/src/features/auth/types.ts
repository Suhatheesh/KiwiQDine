import { InitialCommonType } from "../../models/BaseType";

export interface AuthCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user?: User
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export interface LogOutResponse {
    message: string
}

export interface AuthInitialStateType extends InitialCommonType {
    user: User | null
    logoutMessage: string | null
}

export interface User {
    id: string
    email: string
    phoneNumber: string | null
    name: string
    role: string
    status: string
    avatar: string | null
    tenantId: string
    permissions?: string[]
}