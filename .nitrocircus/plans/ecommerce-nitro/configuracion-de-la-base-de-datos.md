> 🤖 Draft generado automáticamente por el **devops agent**
> **Proyecto:** Ecommerce Nitro | **Task ID:** `69bd9fab04d2abc042bc66fc`

## Archivos a crear/modificar
* `.github/workflows/database.yml`: Archivo de configuración de GitHub Actions para la creación y configuración de la base de datos
* `infra/database.sql`: Script de creación de tablas para la base de datos
* `infra/database_backup.sh`: Script de respaldo de la base de datos
* `docker-compose.yml`: Archivo de configuración de Docker Compose para la base de datos
* `deploy/database_config.py`: Script de configuración de la base de datos para el despliegue

## Plan de implementación
1. Crear un nuevo archivo `database.yml` en `.github/workflows/` con el siguiente contenido:
```yml
name: Database Configuration
on:
  push:
    branches:
      - main
jobs:
  configure-database:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Create database
        run: |
          mysql -u ${{ secrets.DB_USERNAME }} -p${{ secrets.DB_PASSWORD }} < infra/database.sql
      - name: Configure database security
        run: |
          mysql -u ${{ secrets.DB_USERNAME }} -p${{ secrets.DB_PASSWORD }} -e "CREATE USER 'nitro'@'%' IDENTIFIED BY 'nitro'; GRANT ALL PRIVILEGES ON *.* TO 'nitro'@'%';"
      - name: Configure database backup
        run: |
          chmod +x infra/database_backup.sh
          crontab -l | { cat; echo "0 0 * * * /infra/database_backup.sh"; } | crontab -
```
2. Crear un nuevo archivo `database.sql` en `infra/` con el siguiente contenido:
```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10, 2)
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_name VARCHAR(255),
  order_date DATE
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```
3. Crear un nuevo archivo `database_backup.sh` en `infra/` con el siguiente contenido:
```bash
#!/bin/bash

mysqldump -u $DB_USERNAME -p$DB_PASSWORD nitro > /backup/nitro_$(date +'%Y-%m-%d').sql
```
4. Modificar el archivo `docker-compose.yml` para incluir la configuración de la base de datos:
```yml
version: '3'
services:
  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=$DB_PASSWORD
      - MYSQL_DATABASE=nitro
      - MYSQL_USER=nitro
      - MYSQL_PASSWORD=nitro
    volumes:
      - ./infra/database.sql:/docker-entrypoint-initdb.d/database.sql
```
5. Crear un nuevo archivo `database_config.py` en `deploy/` con el siguiente contenido:
```python
import os

DB_USERNAME = os.environ['DB_USERNAME']
DB_PASSWORD = os.environ['DB_PASSWORD']
DB_HOST = os.environ['DB_HOST']
DB_PORT = os.environ['DB_PORT']
DB_NAME = os.environ['DB_NAME']

print(f"DB_USERNAME={DB_USERNAME}")
print(f"DB_PASSWORD={DB_PASSWORD}")
print(f"DB_HOST={DB_HOST}")
print(f"DB_PORT={DB_PORT}")
print(f"DB_NAME={DB_NAME}")
```
6. Establecer las variables de entorno `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` y `DB_NAME` en el archivo `~/.env` o en la configuración de GitHub Actions.

## Impacto en servicios
* La base de datos se creará y configurará para almacenar la información de los productos y los pedidos.
* La seguridad de la base de datos se configurará para prevenir la pérdida de datos.
* El sistema de respaldo se configurará para prevenir la pérdida de datos.

## Criterios de verificación
- [ ] La base de datos se crea correctamente.
- [ ] Las tablas se crean correctamente.
- [ ] La seguridad de la base de datos se configura correctamente.
- [ ] El sistema de respaldo se configura correctamente.
- [ ] La base de datos se puede conectar y utilizar desde la aplicación.