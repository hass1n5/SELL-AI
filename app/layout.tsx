import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'SELL-AI — Market Intelligence',description:'Evidence-first product and profit intelligence.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}