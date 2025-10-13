# JavaScript/TypeScript Style Guide

## Inleiding

Deze style guide definieert de coding standards voor JavaScript en TypeScript code in Sevensa projecten. Het is gebaseerd op de Airbnb JavaScript Style Guide met enkele aanpassingen specifiek voor onze projecten.

## Algemene Principes

1. **Leesbaarheid boven Beknoptheid**: Schrijf code die gemakkelijk te lezen en te begrijpen is, zelfs als dit meer regels code betekent.
2. **Consistentie**: Volg consistente patronen en conventies in de hele codebase.
3. **Documentatie**: Documenteer complexe logica, API's, en niet-triviale beslissingen.
4. **Testbaarheid**: Schrijf code die gemakkelijk te testen is.

## Bestandsorganisatie

- Gebruik `.js` voor JavaScript bestanden en `.ts` voor TypeScript bestanden
- Gebruik `.jsx` voor React JavaScript bestanden en `.tsx` voor React TypeScript bestanden
- Eén component/module per bestand
- Gerelateerde bestanden kunnen in dezelfde directory worden geplaatst
- Gebruik betekenisvolle bestandsnamen in camelCase of kebab-case

## Formatting

- Gebruik 2 spaties voor indentatie
- Gebruik enkele aanhalingstekens (`'`) voor strings
- Voeg een puntkomma toe aan het einde van elke statement
- Houd regels korter dan 100 karakters
- Gebruik spaties rond operatoren
- Geen spatie tussen functienaam en haakje bij aanroep
- Gebruik template literals voor string interpolatie

```javascript
// Goed
const greeting = `Hello, ${name}!`;

// Vermijd
const greeting = 'Hello, ' + name + '!';
```

## Naamgeving

- Gebruik camelCase voor variabelen, functies, en methoden
- Gebruik PascalCase voor klassen, interfaces, en React componenten
- Gebruik UPPER_CASE voor constanten
- Gebruik beschrijvende namen die het doel of de functie weergeven
- Prefix private properties met een underscore (`_`)
- Gebruik semantische naamgeving voor React componenten

```typescript
// Goed
const maxRetryCount = 3;
function calculateTotalPrice() { /* ... */ }
class UserRepository { /* ... */ }
interface UserProfile { /* ... */ }
const DEFAULT_TIMEOUT = 1000;

// Vermijd
const x = 3;
function calc() { /* ... */ }
class Repo { /* ... */ }
```

## TypeScript Specifiek

- Specificeer types voor functie parameters en return values
- Gebruik interfaces voor object shapes
- Vermijd `any` type waar mogelijk
- Gebruik union types voor variabelen die meerdere types kunnen hebben
- Gebruik type guards voor type narrowing
- Gebruik generics voor herbruikbare componenten

```typescript
// Goed
function getUser(id: string): Promise<User> {
  // ...
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Vermijd
function getUser(id): any {
  // ...
}
```

## ES6+ Features

- Gebruik arrow functions voor anonieme functies
- Gebruik destructuring voor object en array extractie
- Gebruik spread operator voor object en array kopieën
- Gebruik template literals voor string interpolatie
- Gebruik `const` voor variabelen die niet opnieuw worden toegewezen
- Gebruik `let` voor variabelen die opnieuw worden toegewezen
- Vermijd `var`

```javascript
// Goed
const { name, email } = user;
const newArray = [...oldArray, newItem];
const newObject = { ...oldObject, newProp: value };

// Vermijd
const name = user.name;
const email = user.email;
const newArray = oldArray.concat([newItem]);
const newObject = Object.assign({}, oldObject, { newProp: value });
```

## React Specifiek

- Gebruik functionele componenten met hooks in plaats van class componenten
- Gebruik destructuring voor props
- Gebruik memo voor performance optimalisatie waar nodig
- Gebruik betekenisvolle namen voor event handlers (handleClick, handleSubmit)
- Gebruik custom hooks voor herbruikbare logica
- Plaats elke prop op een nieuwe regel als er meer dan 3 props zijn

```jsx
// Goed
function UserProfile({ name, email, role }) {
  const handleSubmit = (event) => {
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}

// Vermijd
function UserProfile(props) {
  function onSubmit(event) {
    // ...
  }

  return (
    <form onSubmit={onSubmit}>
      <div>{props.name}</div>
      <div>{props.email}</div>
      <div>{props.role}</div>
    </form>
  );
}
```

## Commentaar

- Gebruik JSDoc voor functies, klassen, en interfaces
- Gebruik inline commentaar voor complexe logica
- Houd commentaar up-to-date met code wijzigingen
- Vermijd overbodige commentaar die alleen herhaalt wat de code al zegt

```javascript
/**
 * Berekent de totale prijs inclusief BTW
 * @param {number} price - De prijs exclusief BTW
 * @param {number} [taxRate=0.21] - Het BTW tarief (standaard 21%)
 * @returns {number} De totale prijs inclusief BTW
 */
function calculateTotalPrice(price, taxRate = 0.21) {
  return price * (1 + taxRate);
}
```

## Imports

- Groepeer imports in de volgende volgorde:
  1. Externe libraries
  2. Interne modules
  3. Relatieve imports
- Sorteer imports alfabetisch binnen elke groep
- Gebruik absolute imports voor interne modules
- Gebruik relatieve imports voor bestanden in dezelfde directory

```javascript
// Externe libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';

// Interne modules
import { formatDate } from '@utils/date';
import { useAuth } from '@hooks/auth';

// Relatieve imports
import { UserCard } from './UserCard';
import styles from './styles.module.css';
```

## Error Handling

- Gebruik try-catch blokken voor error handling
- Vermijd het negeren van errors
- Log errors met voldoende context
- Gebruik custom error klassen voor specifieke error types

```javascript
try {
  const data = await api.fetchData();
  return data;
} catch (error) {
  logger.error('Failed to fetch data', { error, requestId });
  throw new DataFetchError('Failed to fetch data', { cause: error });
}
```

## Testing

- Schrijf unit tests voor alle functies en componenten
- Gebruik beschrijvende test namen
- Volg de AAA pattern (Arrange, Act, Assert)
- Mock externe dependencies
- Test edge cases en error scenarios

```javascript
describe('calculateTotalPrice', () => {
  it('should calculate price with default tax rate', () => {
    // Arrange
    const price = 100;
    
    // Act
    const result = calculateTotalPrice(price);
    
    // Assert
    expect(result).toBe(121);
  });
});
```

## Linting en Formatting

- Gebruik ESLint voor linting
- Gebruik Prettier voor code formatting
- Configureer pre-commit hooks om linting en formatting te enforsen
- Gebruik TypeScript compiler voor type checking

## Conclusie

Door deze style guide te volgen, zorgen we voor een consistente, leesbare, en onderhoudbare codebase. Het helpt nieuwe teamleden om snel up-to-speed te komen en vermindert de cognitieve belasting bij het lezen en begrijpen van code.
