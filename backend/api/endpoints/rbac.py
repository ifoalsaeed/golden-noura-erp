# Permission Endpoints
@router.get("/permissions", response_model=List[PermissionResponse])
def get_permissions(
    skip: int = 0,
    limit: int = 100,
    module: Optional[str] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Get all permissions with optional filtering"""
    # Check permission to view permissions
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.VIEW):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view permissions"
        )
    
    query = db.query(Permission)
    
    if module:
        query = query.filter(Permission.module == module)
    if level:
        query = query.filter(Permission.level == level)
    
    return query.offset(skip).limit(limit).all()

@router.post("/permissions", response_model=PermissionResponse)
def create_permission(
    permission: PermissionCreate,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new permission"""
    # Check permission to create permissions
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.CREATE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create permissions"
        )
    
    # Check if permission already exists
    existing = db.query(Permission).filter(
        and_(
            Permission.module == permission.module,
            Permission.level == permission.level
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already exists"
        )
    
    new_permission = Permission(**permission.dict())
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    
    return new_permission

@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
def update_permission(
    permission_id: int,
    permission_update: PermissionUpdate,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Update a permission"""
    # Check permission to edit permissions
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit permissions"
        )
    
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    update_data = permission_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(permission, field, value)
    
    db.commit()
    db.refresh(permission)
    
    return permission

# Role Endpoints
@router.get("/roles", response_model=List[RoleResponse])
def get_roles(
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Get all roles with optional filtering"""
    # Check permission to view roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.VIEW):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view roles"
        )
    
    query = db.query(Role)
    
    if level:
        query = query.filter(Role.level == level)
    if is_active is not None:
        query = query.filter(Role.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

@router.post("/roles", response_model=RoleResponse)
def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new role"""
    # Check permission to create roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.CREATE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create roles"
        )
    
    # Check if role name already exists
    existing = db.query(Role).filter(Role.name == role.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists"
        )
    
    new_role = rbac.create_role(
        name=role.name,
        description=role.description,
        level=role.level,
        created_by=current_user.id
    )
    
    return new_role

@router.get("/roles/{role_id}", response_model=RoleWithPermissions)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Get a role with its permissions"""
    # Check permission to view roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.VIEW):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view roles"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Get role permissions
    role_permissions = db.query(RolePermission).join(Permission).filter(
        RolePermission.role_id == role_id
    ).all()
    
    # Group permissions by module
    permission_summary = {}
    for rp in role_permissions:
        if rp.is_granted:
            module = rp.permission.module.value
            level = rp.permission.level.value
            if module not in permission_summary:
                permission_summary[module] = []
            permission_summary[module].append(level)
    
    return RoleWithPermissions(
        **role.__dict__,
        permissions=[rp.permission for rp in role_permissions if rp.is_granted],
        permission_summary=permission_summary
    )

@router.put("/roles/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Update a role"""
    # Check permission to edit roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit roles"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if trying to update system role
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update system role"
        )
    
    update_data = role_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
    
    db.commit()
    db.refresh(role)
    
    return role

@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Delete a role"""
    # Check permission to delete roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.DELETE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete roles"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if system role
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system role"
        )
    
    # Check if role is assigned to users
    user_count = db.query(UserRole).filter(UserRole.role_id == role_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete role that is assigned to users"
        )
    
    db.delete(role)
    db.commit()
    
    return {"message": "Role deleted successfully"}

# Role Permission Management
@router.post("/roles/{role_id}/permissions", response_model=RolePermissionResponse)
def grant_permission_to_role(
    role_id: int,
    permission_data: RolePermissionCreate,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Grant a permission to a role"""
    # Check permission to edit roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit role permissions"
        )
    
    role_permission = rbac.grant_permission_to_role(
        role_id=role_id,
        permission_id=permission_data.permission_id,
        granted_by=current_user.id
    )
    
    return role_permission

@router.delete("/roles/{role_id}/permissions/{permission_id}")
def revoke_permission_from_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Revoke a permission from a role"""
    # Check permission to edit roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit role permissions"
        )
    
    success = rbac.revoke_permission_from_role(
        role_id=role_id,
        permission_id=permission_id,
        revoked_by=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found for this role"
        )
    
    return {"message": "Permission revoked successfully"}

@router.post("/roles/{role_id}/permissions/bulk")
def bulk_update_role_permissions(
    role_id: int,
    bulk_update: BulkPermissionUpdate,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Bulk update permissions for a role"""
    # Check permission to edit roles
    if not rbac.has_permission(current_user.id, ModuleType.ROLES, PermissionLevel.EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit role permissions"
        )
    
    # Validate role exists
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    updated_count = 0
    for perm_data in bulk_update.permissions:
        permission_id = perm_data.get("permission_id")
        is_granted = perm_data.get("is_granted", True)
        
        if is_granted:
            rbac.grant_permission_to_role(role_id, permission_id, current_user.id)
        else:
            rbac.revoke_permission_from_role(role_id, permission_id, current_user.id)
        
        updated_count += 1
    
    return {"message": f"Updated {updated_count} permissions successfully"}

# User Role Management
@router.post("/users/{user_id}/roles", response_model=UserRoleResponse)
def assign_role_to_user(
    user_id: int,
    user_role: UserRoleCreate,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Assign a role to a user"""
    # Check permission to edit users
    if not rbac.has_permission(current_user.id, ModuleType.USERS, PermissionLevel.EDIT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to assign roles to users"
        )
    
    user_role_obj = rbac.assign_role_to_user(
        user_id=user_id,
        role_id=user_role.role_id,
        assigned_by=current_user.id,
        expires_at=user_role.expires_at
    )
    
    return user_role_obj

@router.get("/users/{user_id}/permissions", response_model=UserPermissionsResponse)
def get_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive permissions for a user"""
    # Users can view their own permissions, or admins can view any user's permissions
    if current_user.id != user_id and not rbac.has_permission(current_user.id, ModuleType.USERS, PermissionLevel.VIEW):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view user permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user permissions
    permissions = rbac.get_user_permissions(user_id)
    
    # Group permissions by module
    module_permissions = {}
    for permission in permissions:
        module = permission.module.value
        level = permission.level.value
        
        if module not in module_permissions:
            module_permissions[module] = ModulePermissions(module=module)
        
        # Set the appropriate permission flag
        if level == "VIEW":
            module_permissions[module].can_view = True
        elif level == "CREATE":
            module_permissions[module].can_create = True
        elif level == "EDIT":
            module_permissions[module].can_edit = True
        elif level == "DELETE":
            module_permissions[module].can_delete = True
        elif level == "APPROVE":
            module_permissions[module].can_approve = True
        elif level == "EXPORT":
            module_permissions[module].can_export = True
        elif level == "PRINT":
            module_permissions[module].can_print = True
    
    return UserPermissionsResponse(
        user_id=user_id,
        username=user.username,
        role=user.role.name if user.role else "No Role",
        modules=list(module_permissions.values())
    )

# Permission Check Endpoint
@router.post("/check-permission", response_model=PermissionCheckResponse)
def check_permission(
    permission_check: PermissionCheck,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Check if user has specific permission"""
    has_permission = rbac.has_permission(
        permission_check.user_id,
        permission_check.module,
        permission_check.level
    )
    
    # Get user roles for response
    user_roles = db.query(UserRole).join(Role).filter(
        UserRole.user_id == permission_check.user_id,
        UserRole.is_active == True
    ).all()
    
    role_names = [ur.role.name for ur in user_roles]
    
    return PermissionCheckResponse(
        has_permission=has_permission,
        message="Permission granted" if has_permission else "Permission denied",
        user_roles=role_names,
        required_permission=f"{permission_check.module.value}.{permission_check.level.value}"
    )

# Audit Log Endpoints
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    user_id: Optional[int] = None,
    module: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Get audit logs with optional filtering"""
    # Check permission to view audit logs
    if not rbac.has_permission(current_user.id, ModuleType.SETTINGS, PermissionLevel.VIEW):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view audit logs"
        )
    
    logs = rbac.get_audit_logs(
        user_id=user_id,
        module=module,
        action=action,
        limit=limit,
        offset=offset
    )
    
    return logs

# System Initialization Endpoint
@router.post("/initialize-system")
def initialize_system(
    db: Session = Depends(get_db),
    rbac: RBACService = Depends(get_rbac_service),
    current_user: User = Depends(get_current_user)
):
    """Initialize the RBAC system with default permissions and roles"""
    # Only super admin can initialize system
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admin can initialize the system"
        )
    
    # Initialize default permissions
    permissions_created = rbac.initialize_default_permissions()
    
    # Initialize default roles
    roles_created = rbac.initialize_default_roles(current_user.id)
    
    return {
        "message": "System initialized successfully",
        "permissions_created": permissions_created,
        "roles_created": roles_created
    }