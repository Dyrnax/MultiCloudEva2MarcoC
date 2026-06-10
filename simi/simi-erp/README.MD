# SIMI ERP EVA3 - Arquitectura Multi Cloud

Proyecto desarrollado para la Evaluación 3 de Arquitectura Multi Cloud.

La solución implementa un ERP básico para Farmacias SIMI utilizando:

- AWS EC2
- Docker
- Docker Compose
- Node.js
- Express
- AWS RDS PostgreSQL
- AWS S3 para backups
- Portal de autenticación con usuario, contraseña y token
- Security Groups para control de acceso

---

## 1. Estructura del proyecto

```text
/simi/simi-erp/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── .env.example
│   └── public/
│       ├── login.html
│       ├── index.html
│       ├── app.js
│       └── style.css
│
├── scripts/
│   ├── init_rds.sql
│   └── backup_rds_to_s3.sh
│
├── docs/
│   ├── evidencias/
│   └── arquitectura/
│
├── docker-compose.yml
├── README.md
└── .gitignore