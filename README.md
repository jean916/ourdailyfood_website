# OurDailyFood

A clean Next.js + TypeScript + Tailwind starter rebuilt from the project we had reached.

## Run on your Mac

```bash
cd ourdailyfood
npm install
npm run dev
```

Then open:

http://localhost:3000

## Check the project

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Important

The product images in this recovery package are lightweight SVG placeholders so the project works immediately on a new Mac.

You can later replace them with your real JPG images inside:

`public/images/products/`

Then update the image paths in `data/products.ts`.

## GitHub backup

After confirming everything works:

```bash
git init
git add .
git commit -m "Initial OurDailyFood project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
