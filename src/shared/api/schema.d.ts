// BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. `pnpm gen:api` ile yeniden üretilir.
// Kaynak: nizam.io--backend etiket v0.1.1-api (8606788814f448c71449c10d92ee5a1e359a3bf9) — docs/api/openapi.yaml

export interface paths {
    "/.well-known/nizamio-instance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Açık sistem bilgi (keşif) ucu. */
        get: operations["systemInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/healthz/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Süreç ayakta mı (bağımlılık denetlemez). */
        get: operations["healthLive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/healthz/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bağımlılıklar erişilebilir mi. */
        get: operations["healthReady"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bilinen kullanıcı listesi (imleçli). */
        get: operations["listUsers"];
        put?: never;
        /** Kullanıcı oluşturur veya mevcut hesabı aktarır. */
        post: operations["createUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Kullanıcıyı siler (geri alınabilir silme). */
        delete: operations["deleteUser"];
        options?: never;
        head?: never;
        /** Kullanıcı günceller. */
        patch: operations["updateUser"];
        trace?: never;
    };
    "/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Giriş. Web: gövdede token + HttpOnly yenileme çerezi; mobil (X-Nizamio-Client: mobile): access + refresh gövdede. */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Oturumu (ve soyunu) kapatır; web yenileme çerezini siler. */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Parola değiştirme; diğer oturumlar düşer. */
        post: operations["changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Yenileme ve rotasyon. Mobil belirteç gövdede; web belirteci çerezde (gövde {}). */
        post: operations["refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Departman listesi. */
        get: operations["listDepartments"];
        put?: never;
        /** Departman oluşturur. */
        post: operations["createDepartment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Departmanı siler (geri alınabilir silme). */
        delete: operations["deleteDepartment"];
        options?: never;
        head?: never;
        /** Departman günceller. */
        patch: operations["updateDepartment"];
        trace?: never;
    };
    "/v1/departments/{id}/assignable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Departmana atanabilir hesap havuzu. */
        get: operations["listAssignable"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/coordinator": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Departman koordinatörünü atar. */
        post: operations["assignCoordinator"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/coordinator/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Koordinatörlüğü kaldırır; görev etkisi varsa onay ister. */
        delete: operations["removeCoordinator"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Departman üye listesi (yönetim yüzü). */
        get: operations["listMembers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/memberships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Hesabı departmana rolle bağlar. */
        post: operations["assignMembership"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/memberships/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Üyeyi departmandan çıkarır; görev etkisi varsa onay ister. */
        delete: operations["removeMember"];
        options?: never;
        head?: never;
        /** Üyelik rolünü değiştirir; görev etkisi varsa onay ister. */
        patch: operations["updateMembershipRole"];
        trace?: never;
    };
    "/v1/departments/{id}/task-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Departmanın görev özeti. */
        get: operations["taskSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/instance/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Kurulum profili: yalnız yapılandırma alanları. */
        get: operations["instanceProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Oturumdaki hesabın kimliği. */
        get: operations["me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Hesabın departmanları ve rolleri. */
        get: operations["myDepartments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Kapsamdaki program. */
        get: operations["readProgram"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Departmanı kapsamdaki programa bağlar. */
        post: operations["linkDepartment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/programs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Program (dönem) listesi. */
        get: operations["listPrograms"];
        put?: never;
        /** Program oluşturur; aynı ad varsa mevcut döner (200). */
        post: operations["createProgram"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/programs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Programı siler; parola yeniden doğrulanır. */
        delete: operations["deleteProgram"];
        options?: never;
        head?: never;
        /** Program günceller. */
        patch: operations["updateProgram"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AssignableAccount: {
            account_id: string;
            full_name: string;
            /** @description Hesabın hedef departman dışındaki rol bağları ("departman:rol"). */
            roles: string[] | null;
        };
        AssignableList: {
            accounts: components["schemas"]["AssignableAccount"][] | null;
        };
        AssignMembershipRequest: {
            account_id: string;
            role: string;
        };
        ChangePasswordRequest: {
            current_password: string;
            new_password: string;
        };
        ChangePasswordResponse: {
            revoked_sessions: number;
        };
        ChangeRoleRequest: {
            confirm?: boolean;
            role: string;
        };
        CoordinatorRequest: {
            account_id: string;
        };
        CoordinatorResult: {
            account_id: string;
            changed: boolean;
            department_id: string;
            membership_id: string;
            role: string;
        };
        CreateDepartmentRequest: {
            code?: string;
            description?: string;
            kind: string;
            name: string;
        };
        CreateProgramRequest: {
            description?: string;
            name: string;
            year?: number;
        };
        CreateUserRequest: {
            company_admin?: boolean;
            department_id: string;
            email: string;
            full_name?: string;
            role?: string;
            transfer_account_id?: string;
        };
        DeleteDepartmentResult: {
            deleted: boolean;
            department_id: string;
        };
        DeleteProgramRequest: {
            password: string;
        };
        Department: {
            code?: string;
            department_id: string;
            description?: string;
            kind: string;
            name: string;
        };
        DepartmentList: {
            departments: components["schemas"]["Department"][];
        };
        /** @description C2 §3.3 kararlı hata gövdesi. İç hata metni hiçbir zaman taşınmaz. */
        ErrorEnvelope: {
            /** @description Kararlı makine kodu (`<alan>.<durum>`); katalog docs/api/error-codes.json. */
            code: string;
            correlation_id?: string;
            details?: string;
            fields?: components["schemas"]["FieldError"][];
            message: string;
            /** @description Sunucunun ürettiği istek kimliği (X-Request-Id ile aynı). */
            request_id: string;
        };
        FieldError: {
            code: string;
            field: string;
            message: string;
        };
        HealthResponse: {
            /** @enum {string} */
            status: "live" | "ready";
        };
        InstanceProfile: {
            api_version: string;
            brand_color: string;
            display_name: string;
            /** @description `0.0.0` = asgari yok. Karşılaştırmayı istemci yapar. */
            minimum_mobile_version: string;
            /** @description IANA saat dilimi adı. */
            timezone: string;
        };
        KnownUser: {
            account_id: string;
            full_name: string;
            memberships: string[] | null;
        };
        LinkDepartmentRequest: {
            department_id: string;
        };
        LoginRequest: {
            captcha_token?: string;
            email: string;
            password: string;
        };
        LoginResponse: {
            /** @description Mobil erişim belirteci (yalnız mobil). */
            access_token?: string;
            account_id: string;
            /**
             * Format: int64
             * @description Erişim/oturum belirtecinin bitişi (Unix saniyesi).
             */
            expires_at: number;
            force_password_change: boolean;
            /**
             * Format: int64
             * @description Yenileme belirtecinin bitişi (Unix saniyesi).
             */
            refresh_expires_at?: number;
            /** @description Mobil yenileme belirteci (yalnız mobil; web'de çerezdedir). */
            refresh_token?: string;
            /** @description Web oturum belirteci (yalnız web). */
            token?: string;
        };
        Membership: {
            account_id: string;
            department_id: string;
            membership_id: string;
            role: string;
        };
        MembershipChange: {
            membership_id: string;
            unassigned_tasks: number;
            warning: boolean;
        };
        MeResponse: {
            account_id: string;
            email: string;
        };
        MyDepartment: {
            department_id: string;
            name: string;
            role: string;
        };
        MyDepartmentList: {
            departments: components["schemas"]["MyDepartment"][] | null;
        };
        Program: {
            /** @description Yalnız oluşturma yanıtında; yeni kayıt açıldıysa `true`. */
            created?: boolean;
            description?: string;
            name: string;
            program_id: string;
            year?: number;
        };
        ProgramDepartmentLink: {
            department_id: string;
            program_id: string;
        };
        ProgramList: {
            programs: components["schemas"]["Program"][];
        };
        RefreshRequest: {
            /** @description Mobil yenileme belirteci. Boş/yoksa web çerezi okunur. */
            refresh_token?: string;
        };
        RefreshResponse: {
            access_token?: string;
            account_id: string;
            /** Format: int64 */
            expires_at: number;
            /** Format: int64 */
            refresh_expires_at: number;
            refresh_token?: string;
            token?: string;
        };
        RosterList: {
            members: components["schemas"]["RosterMember"][] | null;
        };
        RosterMember: {
            account_id: string;
            full_name: string;
            membership_id: string;
            role: string;
            /** @enum {string} */
            status: "active" | "deleted";
        };
        SystemInfo: {
            api_version: string;
            capabilities: string[] | null;
            company_display_name: string;
            /** @description Aktivasyon tamamlanmadıysa boş. */
            instance_id: string;
            minimum_mobile_version: string;
            product_id: string;
            server_version: string;
        };
        TaskSummary: {
            active_items: number;
            completed_items: number;
            department_id: string;
        };
        UpdateDepartmentRequest: {
            code?: string | null;
            description?: string | null;
            kind?: string | null;
            name?: string | null;
        };
        UpdateProgramRequest: {
            description?: string | null;
            name?: string | null;
            year?: number | null;
        };
        UpdateUserRequest: {
            company_admin?: boolean | null;
            email?: string | null;
            force_password_change?: boolean | null;
            full_name?: string | null;
            reset_password?: boolean | null;
        };
        UserList: {
            next_cursor?: string;
            users: components["schemas"]["KnownUser"][] | null;
        };
        UserResult: {
            account_id: string;
            changed_fields?: string[];
            created?: boolean;
            membership_id?: string;
            revoked_sessions?: number;
            transferred?: boolean;
        };
    };
    responses: never;
    parameters: {
        /** @description `mobile` ise mobil belirteç çifti gövdede döner; diğer her değer web sayılır. */
        ClientCategory: string;
        /** @description `true` ise görev etkisi onaylanmış sayılır (aksi hâlde 409 organization.confirmation_required). */
        Confirm: "true" | "false";
        /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
        CsrfHeader: string;
        /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
        Cursor: string;
        /** @description Departman kapsamı (S3 uçlarda zorunlu). */
        DepartmentScope: string;
        Limit: number;
        PathAccountID: string;
        PathID: string;
        /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
        ProgramScope: string;
        UserRole: string;
        UserSearch: string;
        UserSortBy: string;
        UserSortOrder: string;
        /** @description Web yenileme belirteci (gövdede `refresh_token` yoksa okunur). */
        WebRefreshCookie: string;
    };
    requestBodies: never;
    headers: {
        /** @description Liste üst sınırda kesildiyse `true` (en çok 200 satır). */
        ResultTruncated: "true";
        /** @description Yeniden denemeden önce beklenecek saniye. */
        RetryAfter: number;
        /** @description Web girişinde/yenilemesinde HttpOnly yenileme çerezi; mobil yanıtta yoktur. */
        WebRefreshSetCookie: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    systemInfo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SystemInfo"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    healthLive: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    healthReady: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listUsers: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                role?: components["parameters"]["UserRole"];
                search?: components["parameters"]["UserSearch"];
                sort_by?: components["parameters"]["UserSortBy"];
                sort_order?: components["parameters"]["UserSortOrder"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createUser: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateUserRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteUser: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateUser: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    login: {
        parameters: {
            query?: never;
            header: {
                /** @description `mobile` ise mobil belirteç çifti gövdede döner; diğer her değer web sayılır. */
                "X-Nizamio-Client"?: components["parameters"]["ClientCategory"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Set-Cookie": components["headers"]["WebRefreshSetCookie"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    changePassword: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePasswordRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChangePasswordResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    refresh: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: {
                /** @description Web yenileme belirteci (gövdede `refresh_token` yoksa okunur). */
                nizamio_web_refresh?: components["parameters"]["WebRefreshCookie"];
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Set-Cookie": components["headers"]["WebRefreshSetCookie"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RefreshResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDepartments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DepartmentList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDepartmentRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Department"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeleteDepartmentResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateDepartmentRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Department"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listAssignable: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssignableList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    assignCoordinator: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CoordinatorRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CoordinatorResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeCoordinator: {
        parameters: {
            query?: {
                /** @description `true` ise görev etkisi onaylanmış sayılır (aksi hâlde 409 organization.confirmation_required). */
                confirm?: components["parameters"]["Confirm"];
            };
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembershipChange"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listMembers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RosterList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    assignMembership: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignMembershipRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Membership"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeMember: {
        parameters: {
            query?: {
                /** @description `true` ise görev etkisi onaylanmış sayılır (aksi hâlde 409 organization.confirmation_required). */
                confirm?: components["parameters"]["Confirm"];
            };
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembershipChange"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateMembershipRole: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeRoleRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembershipChange"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    taskSummary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskSummary"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    instanceProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstanceProfile"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    myDepartments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyDepartmentList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    readProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    linkDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LinkDepartmentRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgramDepartmentLink"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listPrograms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgramList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateProgramRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteProgramRequest"];
            };
        };
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProgramRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
}
