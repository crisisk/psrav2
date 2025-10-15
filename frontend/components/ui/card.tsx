import * as React from 'react';
export function Card({className='',...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={`card ${className}`} {...props}/>} 
export function CardHeader({className='',...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={`px-5 pt-5 ${className}`} {...props}/>} 
export function CardTitle({className='',...props}:React.HTMLAttributes<HTMLHeadingElement>){return <h3 className={`text-lg font-semibold ${className}`} {...props}/>} 
export function CardContent({className='',...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={`px-5 pb-5 ${className}`} {...props}/>} 
