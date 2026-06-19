# DineFlow - SaaS Restaurant & Food Court Management System

A comprehensive cloud-based solution for digitizing restaurant and food court operations with multi-tenant architecture, contactless ordering, and real-time order tracking.

## 🚀 Features

### Core Functionality
- **Multi-Tenant SaaS Architecture**: Support for multiple restaurants and food courts with tenant isolation
- **Contactless Ordering**: QR code-based ordering system for both restaurants and food courts
- **Real-time Order Tracking**: Live order status updates between kitchen and customers
- **Role-based Authentication**: JWT-based auth with different user roles (Super Admin, Tenant Owner, Waiter, Customer)
- **Phone-based Customer Auth**: OTP verification for customers without requiring registration

### Restaurant Features
- Restaurant profile management
- Menu and item management with categories and addons
- Table management with QR codes
- Order management and kitchen display
- Real-time order status updates

### Food Court Features
- Multi-vendor food court management
- Consolidated QR scanning with separate billing per vendor
- Vendor-specific menus and order management
- Unified payment processing

### Admin Features
- Super admin dashboard for platform management
- Tenant management and subscription handling
- Analytics and reporting
- User role management

## 🏗️ Architecture

### Technology Stack
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **QR Codes**: QRCode library for generation
- **Validation**: Class-validator and class-transformer

### Database Design
- **Tenant-based Isolation**: All data is isolated by tenant_id
- **Entity Relationships**: Proper foreign key relationships between entities
- **Audit Trail**: Created/updated timestamps on all entities
- **Soft Deletes**: Status-based soft deletion for data integrity

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DineFlow-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=dineflow_saas

   # JWT Configuration
   JWT_ACCESS_TOKEN_SECRET=your-super-secret-access-token-key
   JWT_ACCESS_TOKEN_EXPIRATION_TIME=15m
   JWT_REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
   JWT_REFRESH_TOKEN_EXPIRATION_TIME=7d

   # Application Configuration
   NODE_ENV=development
   PORT=4000

   # Super Admin Configuration
   SUPER_ADMIN_EMAIL=admin@dineflow.com
   SUPER_ADMIN_PASSWORD=SuperAdmin@123
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb dineflow_saas
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

## 🗄️ Database Schema

### Core Entities

#### Tenant
- Multi-tenant isolation
- Subdomain-based routing
- Subscription management

#### User
- Role-based access control
- Tenant association
- JWT token management

#### Restaurant
- Restaurant profile and settings
- Menu and table management
- Order processing

#### Food Court
- Multi-vendor management
- Consolidated billing
- Vendor coordination

#### Order System
- Order lifecycle management
- Item and addon tracking
- Payment processing
- Status history

## 🔐 Authentication & Authorization

### User Roles
- **SUPER_ADMIN**: Platform management, tenant oversight
- **TENANT_OWNER**: Tenant-level management
- **RESTAURANT_ADMIN**: Restaurant management
- **RESTAURANT_MANAGER**: Restaurant operations
- **WAITER**: Order management and service
- **KITCHEN_STAFF**: Kitchen operations
- **FOOD_COURT_MANAGER**: Food court management
- **VENDOR_ADMIN**: Vendor-specific management
- **CUSTOMER**: Order placement and tracking

### Authentication Flow
1. **Staff/Admin**: Email/password login with JWT tokens
2. **Customers**: Phone number + OTP verification
3. **Token Management**: Access tokens (15min) + Refresh tokens (7 days)

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - Staff/Admin login
- `POST /api/auth/register` - User registration
- `POST /api/auth/phone-login` - Send OTP to customer
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Tenant Management
- `GET /api/tenants` - List all tenants (Super Admin)
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:id` - Get tenant details
- `PATCH /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### QR Code Management
- `POST /api/qr-codes` - Generate QR code
- `GET /api/qr-codes` - List QR codes
- `GET /api/qr-codes/code/:code` - Get QR code by code
- `PATCH /api/qr-codes/:id/status` - Update QR code status

### Customer Portal
- `GET /api/customer-portal/qr/:code` - Get QR code info
- `GET /api/customer-portal/restaurant/:slug/menu` - Restaurant menu
- `GET /api/customer-portal/food-court/:slug/vendors` - Food court vendors
- `POST /api/customer-portal/order` - Create order
- `GET /api/customer-portal/orders` - User orders

### Order Management
- `GET /api/orders` - List orders with filters
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id` - Update order
- `POST /api/orders/:id/confirm` - Confirm order
- `POST /api/orders/:id/process-payment` - Process payment

### Real-time Order Status
- `POST /api/order-status` - Create status update
- `GET /api/order-status/order/:id/history` - Status history
- `GET /api/order-status/active-orders` - Active orders
- `PATCH /api/order-status/order-item/:id/status` - Update item status

### Kitchen Display
- `GET /api/kitchen-display/orders` - Kitchen orders
- `GET /api/kitchen-display/order-items` - Order items
- `POST /api/kitchen-display/order-item/:id/start` - Start item
- `POST /api/kitchen-display/order-item/:id/ready` - Mark ready

### WebSocket Events
- `authenticate` - Authenticate WebSocket connection
- `subscribe_order` - Subscribe to order updates
- `subscribe_restaurant_orders` - Subscribe to restaurant orders
- `order_status_update` - Real-time status updates
- `new_order` - New order notifications

## 🔧 Development

### Project Structure
```
src/
├── infrastructure/
│   ├── auth/           # Authentication system
│   ├── database/       # Database entities and config
│   ├── middlewares/    # Custom middlewares
│   └── guards/         # Route guards
├── tenant/             # Tenant management
├── qr-code/            # QR code generation
└── main.ts             # Application entry point
```

### Key Features Implementation

#### Tenant Isolation
- Middleware extracts tenant from subdomain or header
- All database queries include tenant filtering
- Guards ensure users can only access their tenant data

#### QR Code System
- Unique QR codes for restaurant tables
- Common area QR codes for food courts
- Dynamic URL generation based on tenant/restaurant

#### Order Management
- Real-time status updates
- Multi-vendor order handling
- Payment processing integration ready

## 🚀 Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy application

### Docker Support (Optional)
```bash
# Build Docker image
docker build -t dineflow-backend .

# Run with Docker Compose
docker-compose up -d
```

## 📊 Monitoring & Analytics

- Application logging with structured logs
- Database query monitoring
- Performance metrics collection
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Roadmap

### Phase 1 (Current)
- ✅ Core SaaS architecture
- ✅ Multi-tenant support
- ✅ JWT authentication
- ✅ QR code system
- ✅ Complete order management
- ✅ Real-time order status tracking
- ✅ Kitchen display system
- ✅ WebSocket integration
- ✅ Customer portal
- ✅ Phone-based authentication
- ✅ Role-based access control

### Phase 2 (Planned)
- [ ] Advanced analytics dashboard
- [ ] Loyalty and reward programs
- [ ] Third-party delivery integrations
- [ ] Mobile app development
- [ ] Advanced reporting features

### Phase 3 (Future)
- [ ] AI-powered recommendations
- [ ] Inventory management
- [ ] Staff scheduling
- [ ] Multi-language support
- [ ] Advanced payment gateways