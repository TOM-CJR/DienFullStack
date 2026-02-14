      /**
       * Token 管理工具类
       * 负责 JWT token 的存储、获取和清除
       */
      class TokenManager {
        private static TOKEN_KEY = 'auth_token';
      
        /**
         * 保存 token 到 localStorage
         * @param token JWT token 字符串
         */
        static setToken(token: string): void {
          localStorage.setItem(this.TOKEN_KEY, token);
        }
      
        /**
         * 从 localStorage 获取 token
         * @returns token 字符串，如果不存在则返回 null
         */
        static getToken(): string | null {
          return localStorage.getItem(this.TOKEN_KEY);
        }
      
        /**
         * 清除 localStorage 中的 token
         */
        static clearToken(): void {
          localStorage.removeItem(this.TOKEN_KEY);
        }
      
        /**
         * 从 JWT token 中提取过期时间
         * @param token JWT token 字符串
         * @returns 过期时间的时间戳（秒），如果解析失败返回 null
         */
        static getTokenExpiration(token: string): number | null {
          try {
            // 验证 token 格式是否为标准 JWT 格式 (header.payload.signature)
            const parts = token.split('.');
            if (parts.length !== 3) {
              console.error('无效的 JWT token 格式');
              return null;
            }
            
            const payload = parts[1];
            if (!payload) {
              console.error('JWT token payload 为空');
              return null;
            }
            
            const decodedPayload = atob(payload);
            const payloadObj = JSON.parse(decodedPayload);
            return payloadObj.exp;
          } catch (error) {
            console.error('解析 token 失败:', error);
            return null;
          }
        }
      
        /**
         * 检查 token 是否已过期
         * @param token JWT token 字符串
         * @returns 如果 token 已过期返回 true，否则返回 false
         */
        static isTokenExpired(token: string): boolean {
          const exp = this.getTokenExpiration(token);
          if (!exp) {
            return true;
          }
          return Date.now() >= exp * 1000;
        }
      
        /**
         * 检查是否存在有效的 token
         * @returns 如果存在未过期的 token 返回 true，否则返回 false
         */
        static hasToken(): boolean {
          const token = this.getToken();
          if (!token) {
            return false;
          }
          return !this.isTokenExpired(token);
        }
      }
      
      export default TokenManager;