import connectDB from "@/configs/dbConfig/dbConfig";
import clientPromise from "@/configs/mongodbClient";
import Users from "@/models/user";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { Adapter } from "next-auth/adapters";
import type { NextAuthOptions } from "next-auth";
import Credentials, {
  CredentialsProvider,
} from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { isDotDotDotToken } from "typescript";
import { EMAIL_TYPE } from "@/constants/email";
import { sendMail } from "@/helpers/mailer";
import { createStripeCustomer } from "@/configs/stripe";

// Validação de variáveis de ambiente obrigatórias para produção
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ Variáveis de ambiente de autenticação (Google/Secret) não configuradas. Verifique seu ambiente de produção.");
  }
}

export const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", placeholder: "user@example.com" },
        password: { label: "Password", placeholder: "********" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais incompletas.");
        }
        await connectDB();

        const foundUser = await Users.findOne({ email: credentials.email });

        if (!foundUser || !foundUser.password) {
          throw new Error("Usuário não encontrado ou senha não configurada.");
        }
        
        const isMatch = await bcrypt.compare(
          credentials.password,
          foundUser.password
        );

        if (!isMatch) {
          throw new Error("Senha incorreta.");
        }
        
        return foundUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.name = (user as any).username || (user as any).name;
      }
      return token;
    },

    async signIn({ account, profile }: any) {
      if (account?.provider === "google") {
        if (!profile?.email) {
          throw new Error("Email não fornecido pelo Google.");
        }

        try {
          await connectDB();
          const { email, email_verified, name, picture } = profile;

          const userFound = await Users.findOne({ email });

          if (!userFound) {
            // Criar cliente no Stripe imediatamente (apenas se configurado)
            let stripeCustomerId = null;
            if (process.env.STRIPE_SECRET_KEY) {
              try {
                const customer = await createStripeCustomer(email);
                stripeCustomerId = customer.id;
                console.log("✅ Cliente Stripe criado:", stripeCustomerId);
              } catch (stripeError: any) {
                console.error("❌ Erro ao criar cliente no Stripe:", stripeError.message);
                // Não bloqueia o cadastro se Stripe falhar
              }
            } else {
              console.warn("⚠️ STRIPE_SECRET_KEY não configurada, pulando criação de cliente");
            }

            // Criação de novo usuário via Google
            console.log("📝 Criando usuário:", email);
            const userCreated = await Users.create({
              email,
              name,
              image: picture,
              role: "user",
              provider: "google",
              isVarified: email_verified,
              stripeCustomerId: stripeCustomerId,
            });

            if (!userCreated) {
              console.error("❌ Falha ao criar usuário no banco");
              return false;
            }
            
            console.log("✅ Usuário criado com sucesso:", userCreated._id);

            // Se não verificado no Google, envia email de verificação
            if (!email_verified) {
              await sendMail(email, userCreated._id.toString(), EMAIL_TYPE.VERIFY);
            }

            profile.role = userCreated.role;
          } else {
            console.log("👤 Usuário já existe:", email);
            // Se o usuário existe mas não tem Stripe Customer ID, cria agora
            if (!userFound.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
              try {
                const customer = await createStripeCustomer(email);
                await Users.findByIdAndUpdate(userFound._id, { 
                  stripeCustomerId: customer.id 
                });
                console.log("✅ Cliente Stripe atualizado para usuário existente");
              } catch (stripeError: any) {
                console.error("❌ Erro ao atualizar cliente no Stripe:", stripeError.message);
              }
            }

            // Atualiza papel do usuário existente no perfil da sessão
            profile.role = userFound.role;
            
            // Opcional: Atualizar info do usuário vinda do Google (ex: imagem)
            if (!userFound.image && picture) {
              await Users.findByIdAndUpdate(userFound._id, { image: picture });
            }
          }
          return true;
        } catch (error) {
          console.error("Erro no callback de login (Google):", error);
          return false;
        }
      }
      return true;
    },

    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).name = token.name;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redireciona erros de login para a página de login
  },
};
