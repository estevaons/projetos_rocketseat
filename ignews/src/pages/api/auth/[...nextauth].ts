import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'
import { query as q } from 'faunadb';


import {fauna} from '../../../services/fauna';

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      scope:'read:user'
    }),
  ],


  callbacks: {
    async signIn(user, account, profile) {
      const { email } = user

      try{
        // verifica se o email do usario já está cadastradado no db
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index('user_by_email'),
                  q.Casefold(user.email)
                )
              )
            ),
            //cria usuario
            q.Create(
              q.Collection('users'),
              {data: {email}}
            ),
            //atualiza dados do usuario
            q.Get(
              q.Match(
                q.Index('user_by_email'),
                q.Casefold(user.email)
              )
            )
          )
        )
        
        return true

      }catch{
        return false
      }
  
    }
  },
})