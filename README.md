# ERP CRM

```bash
npm install
docker compose up -d
npx prisma migrate dev     # accepter le nom de migration proposé
npm run db:seed            # base de développement : admin@example.com / ChangeMe123!
npm run dev                # génère AUTH_SECRET dans .env si absent
```

`Ctrl K` (ou `⌘ K`) ouvre la recherche globale et les actions rapides.
