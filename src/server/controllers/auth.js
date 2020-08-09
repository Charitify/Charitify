import { AuthService } from "../services";

const login = async (data) => {
  return AuthService.login(data);
};

const register = async (data) => {
  return AuthService.register(data);
};

export default { login, register };
