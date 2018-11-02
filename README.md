# Ejercicio 4

A pesar del sistema de registro de mensajes, los costes de envío de mensajes son muy altos y queremos limitar dichos costes.

Para ello, queremos implementar una nueva funcionalidad que consiste en que el servicio tenga, inicialmente un _crédito_ de mensajes,
y una vez consumido el crédito, empiece a devolver errores.

Esta funcionalidad se implementará, de nuevo, ampliando el API que ofrece nuestro servicio.

## 1. Almacenar el crédito

- Ampliar el modelo de datos para tener un _crédito_ global.

## 2. Pagar por cada mensaje

- El endpoint `/message` de tipo POST debe, ahora, comprobar que hay crédito suficiente para poder enviar el mensaje.
- En caso afirmativo, debe enviar el mensaje y, si se envía correctamente, decrementar el _crédito_ restante.
- En caso negativo, se devuelve un mensaje de error indicando que no hay crédito suficiente.

## 3. Recargar el crédito.

De poco sirve un servicio que una vez agotado el crédito deja de funcionar, necesitamos poder incrementar el crédito existente.
Para ello, debemos ofrecer un método nuevo en el API para meter crédito:

- El endpoint será `/credit`
- El método será de tipo POST
- El contenido de la petición será en formato JSON y contendrá un único campo, `amount`, de tipo entero.
  Por ejemplo:
```json
{
  "amount": 10
}
```

## 4. ¿Tenemos un sistema de crédito robusto?

Una vez más, nos surge la duda de cómo de robusto es el servicio que hemos montado.
No queremos que se envíen mensajes si no tenemos crédito, ni queremos que no se pueda ampliar el crédito, pero sobre todo, no queremos que haya inconsistencias entre el crédito que hemos añadido al servicio, el consumo que hemos hecho del dicho crédito, y el crédito restante... es decir, no podemos permitirnos que el dinero aparezca o desaparezca.

Para ello, algunas de las cuestiones que hay que revisar y validar que funcionan correctamente son:
- Si hay 2 envíos de mensajes concurrentes, el crédito ha de decrementarse correctamente
- Si se envía un mensaje mientras se recibe una recarga, el crédito final ha de ser consistente
- Si existe crédito y el envío del mensaje falla, el crédito ha de restaurarse correctamente, incluso aunque haya otros envíos concurrentes
- Si existe crédito y el proveedor externo ha dado timeout, hay que definir un comportamiento consistente para el crédito en este caso (p. ej. consumir el crédito para evitar sobrecostes y luego revisar el que no se haya consumido realmente y recargarlo).

Dado que tenemos una única instancia del servicio, todas estas cuestiones pueden resolverse mediante locks.
