import React, { useState, useEffect } from 'react';
import { api } from '../../api/index.js';
import { 
  GitBranch, 
  Layers, 
  ShieldCheck, 
  Building2, 
  History, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Edit3,
  Sliders,
  CheckCircle2,
  XCircle,
  MoreVertical,
  X,
  Search,
  Settings,
  ArrowRight,
  FileText,
  ChevronRight,
  Users,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Shield,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  UserX,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const AdminConfigPage = () => {
  const [activeTab, setActiveTab] = useState('fields'); // Default to custom fields & template config

  // Section configuration in secondary navigation
  const [sections, setSections] = useState([
    { id: 'all', name: 'All Fields' },
    { id: 'contact', name: 'Contact Details' },
    { id: 'basic', name: 'Basic Details' },
    { id: 'parent', name: 'Parent Details' },
    { id: 'education', name: 'Education Details' },
    { id: 'grievance', name: 'Grievance Details' },
  ]);
  const [selectedSectionId, setSelectedSectionId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [pipelinesList, setPipelinesList] = useState([]);
  const [fieldsList, setFieldsList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Users Directory Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create User Form States
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserType, setNewUserType] = useState('Student');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('CampusPass@2026!');
  const [newUserRole, setNewUserRole] = useState('Student');
  const [newUserBranch, setNewUserBranch] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserMustChangePassword, setNewUserMustChangePassword] = useState(true);
  const [newUserActive, setNewUserActive] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [showPasswordPlain, setShowPasswordPlain] = useState(false);

  // User Details Drawer States
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [showUserDetailsDrawer, setShowUserDetailsDrawer] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Edit User Modal States
  const [editingUser, setEditingUser] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserBranch, setEditUserBranch] = useState('');
  const [editUserDepartment, setEditUserDepartment] = useState('');
  const [editUserActive, setEditUserActive] = useState(true);
  const [savingEditUser, setSavingEditUser] = useState(false);
  const [editUserError, setEditUserError] = useState('');

  // Change Role Modal States
  const [changingRoleUser, setChangingRoleUser] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [changeRoleUserType, setChangeRoleUserType] = useState('Management');
  const [changeRoleSelected, setChangeRoleSelected] = useState('');
  const [changeRoleBranch, setChangeRoleBranch] = useState('');
  const [savingChangeRole, setSavingChangeRole] = useState(false);
  const [changeRoleError, setChangeRoleError] = useState('');

  // Reset Password Modal States
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [savingResetPassword, setSavingResetPassword] = useState(false);
  const [resetPasswordSuccessResult, setResetPasswordSuccessResult] = useState(null);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [copiedTempPassword, setCopiedTempPassword] = useState(false);

  // Active Dropdown Action Menu
  const [activeUserMenuId, setActiveUserMenuId] = useState(null);

  // Admin Account & Security Tab State
  const [adminAccount, setAdminAccount] = useState(null);
  const [loadingAdminAccount, setLoadingAdminAccount] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [savingAdminEmail, setSavingAdminEmail] = useState(false);
  const [adminEmailSuccess, setAdminEmailSuccess] = useState('');
  const [adminEmailError, setAdminEmailError] = useState('');

  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [savingAdminPassword, setSavingAdminPassword] = useState(false);
  const [adminPasswordSuccess, setAdminPasswordSuccess] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');

  // Modals & Drawers for Fields / Pipelines
  const [showFieldDrawer, setShowFieldDrawer] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Field Drawer Form State
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldRefId, setFieldRefId] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldUnique, setFieldUnique] = useState(false);
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldSection, setFieldSection] = useState('contact');

  // Pipeline modal
  const [showNewPipelineModal, setShowNewPipelineModal] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');

  // Section modal
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Role Matrix State
  const [permissionMatrix, setPermissionMatrix] = useState({
    'Super Admin': { view: true, create: true, edit: true, delete: true, approve: true },
    'Dean': { view: true, create: false, edit: true, delete: false, approve: true },
    'Head of Department (HOD)': { view: true, create: false, edit: true, delete: false, approve: true },
    'Pipeline Coordinator': { view: true, create: true, edit: true, delete: false, approve: false },
    'Student': { view: true, create: true, edit: false, delete: false, approve: false },
  });

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  const loadAllAdminData = async () => {
    try {
      if (activeTab === 'pipelines') {
        const res = await api.pipelines.list();
        setPipelinesList(res?.data || []);
      } else if (activeTab === 'fields') {
        const [fieldsRes, sectionsRes] = await Promise.all([
          api.fields.list().catch(err => ({ data: [] })),
          api.fields.listSections().catch(err => ({ data: [] })),
        ]);
        const list = fieldsRes?.data || [];
        setFieldsList(list);

        const loadedSections = sectionsRes?.data || [];
        if (loadedSections.length > 0) {
          setSections(loadedSections);
        }
      } else if (activeTab === 'roles') {
        const res = await api.roles.list();
        setRolesList(res?.data || []);
      } else if (activeTab === 'users') {
        setLoadingUsers(true);
        const [usersRes, rolesRes, branchesRes, deptsRes] = await Promise.all([
          api.admin.users.list().catch(() => ({ data: [] })),
          api.roles.list().catch(() => ({ data: [] })),
          api.admin.branches.list().catch(() => ({ data: [] })),
          api.admin.departments.list().catch(() => ({ data: [] })),
        ]);
        setUsersList(usersRes?.data || []);
        if (rolesRes?.data?.length > 0) {
          setRolesList(rolesRes.data);
        }
        if (branchesRes?.data?.length > 0) {
          setBranchesList(branchesRes.data);
        }
        if (deptsRes?.data?.length > 0) {
          setDepartmentsList(deptsRes.data);
        }
        setLoadingUsers(false);
      } else if (activeTab === 'security') {
        setLoadingAdminAccount(true);
        const res = await api.admin.account.get().catch(() => ({ data: null }));
        if (res?.data) {
          setAdminAccount(res.data);
          setAdminEmailInput(res.data.email || '');
        }
        setLoadingAdminAccount(false);
      } else if (activeTab === 'audit') {
        const res = await api.audit.list();
        setAuditLogsList(res?.data || []);
      } else if (activeTab === 'branches') {
        const res = await api.college.campuses();
        setBranchesList(res?.data || []);
      }
    } catch (err) {
      console.warn('Error loading admin tab data:', err.message);
      setLoadingUsers(false);
      setLoadingAdminAccount(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    setActiveUserMenuId(null);
    try {
      const newStatus = !user.isActive;
      await api.admin.users.toggleStatus(user.id, newStatus);
      setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
      if (selectedUserForDetails && selectedUserForDetails.id === user.id) {
        setSelectedUserForDetails(prev => ({ ...prev, isActive: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update user status');
    }
  };

  const handleOpenUserDetails = async (u) => {
    setActiveUserMenuId(null);
    setSelectedUserForDetails(u);
    setShowUserDetailsDrawer(true);
    setLoadingUserDetails(true);
    try {
      const res = await api.admin.users.get(u.id);
      if (res?.data) {
        setSelectedUserForDetails(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch user details:', err);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleOpenEditUser = (u) => {
    setActiveUserMenuId(null);
    setEditingUser(u);
    setEditUserName(u.name || '');
    setEditUserPhone(u.phone || '');
    setEditUserBranch(u.branchId || '');
    setEditUserDepartment(u.departmentId || '');
    setEditUserActive(u.isActive !== false);
    setEditUserError('');
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEditUser(true);
    setEditUserError('');
    try {
      const res = await api.admin.users.update(editingUser.id, {
        name: editUserName,
        phone: editUserPhone,
        branchId: editUserBranch || null,
        departmentId: editUserDepartment || null,
        isActive: editUserActive,
      });
      if (res?.data) {
        setUsersList(prev => prev.map(u => u.id === editingUser.id ? { 
          ...u, 
          name: editUserName, 
          phone: editUserPhone, 
          branchId: editUserBranch,
          branchName: branchesList.find(b => b.id === editUserBranch)?.name || u.branchName,
          departmentId: editUserDepartment,
          departmentName: departmentsList.find(d => d.id === editUserDepartment)?.name || u.departmentName,
          isActive: editUserActive 
        } : u));
        if (selectedUserForDetails && selectedUserForDetails.id === editingUser.id) {
          setSelectedUserForDetails(prev => ({ ...prev, ...res.data }));
        }
        setShowEditUserModal(false);
      }
    } catch (err) {
      setEditUserError(err.response?.data?.message || err.message || 'Failed to update user');
    } finally {
      setSavingEditUser(false);
    }
  };

  const handleOpenChangeRole = (u) => {
    setActiveUserMenuId(null);
    setChangingRoleUser(u);
    const isStudent = (u.userType || '').toLowerCase() === 'student' || (u.roles || []).some(r => (r.name || '').toLowerCase() === 'student');
    const targetType = isStudent ? 'Student' : 'Management';
    setChangeRoleUserType(targetType);
    const currentRoleName = u.roles?.[0]?.name || (isStudent ? 'Student' : 'Admission Officer');
    setChangeRoleSelected(currentRoleName);
    setChangeRoleBranch(u.branchId || '');
    setChangeRoleError('');
    setShowChangeRoleModal(true);
  };

  const handleSaveChangeRole = async (e) => {
    e.preventDefault();
    if (!changingRoleUser) return;
    setSavingChangeRole(true);
    setChangeRoleError('');
    try {
      const res = await api.admin.users.changeRole(changingRoleUser.id, {
        roleName: changeRoleSelected,
        branchId: changeRoleBranch || undefined,
      });
      if (res?.data) {
        const refreshed = await api.admin.users.list();
        setUsersList(refreshed?.data || []);
        if (selectedUserForDetails && selectedUserForDetails.id === changingRoleUser.id) {
          const detailRes = await api.admin.users.get(changingRoleUser.id);
          if (detailRes?.data) setSelectedUserForDetails(detailRes.data);
        }
        setShowChangeRoleModal(false);
      }
    } catch (err) {
      setChangeRoleError(err.response?.data?.message || err.message || 'Failed to change role');
    } finally {
      setSavingChangeRole(false);
    }
  };

  const handleOpenResetPassword = (u) => {
    setActiveUserMenuId(null);
    setResetPasswordUser(u);
    const generated = 'CampusPass@' + Math.floor(1000 + Math.random() * 9000);
    setResetPasswordInput(generated);
    setResetPasswordSuccessResult(null);
    setResetPasswordError('');
    setCopiedTempPassword(false);
    setShowResetPasswordModal(true);
  };

  const handleSaveResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordUser || !resetPasswordInput) return;
    setSavingResetPassword(true);
    setResetPasswordError('');
    try {
      await api.admin.users.resetPassword(resetPasswordUser.id, {
        temporaryPassword: resetPasswordInput,
      });
      setResetPasswordSuccessResult(resetPasswordInput);
    } catch (err) {
      setResetPasswordError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setSavingResetPassword(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setCreateUserError('');
    try {
      const effectiveRole = newUserType === 'Student' ? 'Student' : newUserRole;
      const res = await api.admin.users.create({
        name: newUserName,
        email: newUserEmail,
        phone: newUserPhone || null,
        userType: newUserType,
        roleName: effectiveRole,
        branchId: newUserBranch || null,
        departmentId: newUserDepartment || null,
        password: newUserPassword,
        isActive: newUserActive,
      });
      if (res?.data) {
        setUsersList(prev => [res.data, ...prev]);
        setShowCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        setNewUserPassword('CampusPass@2026!');
        setNewUserType('Student');
        setNewUserRole('Student');
        setNewUserBranch('');
        setNewUserDepartment('');
        setNewUserActive(true);
      }
    } catch (err) {
      setCreateUserError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateAdminEmail = async (e) => {
    e.preventDefault();
    setSavingAdminEmail(true);
    setAdminEmailError('');
    setAdminEmailSuccess('');
    try {
      const res = await api.admin.account.updateEmail(adminEmailInput);
      setAdminEmailSuccess('Admin login email updated successfully!');
      if (res?.data?.email) {
        setAdminAccount(prev => ({ ...prev, email: res.data.email }));
      }
    } catch (err) {
      setAdminEmailError(err.response?.data?.message || err.message || 'Failed to update admin email');
    } finally {
      setSavingAdminEmail(false);
    }
  };

  const handleUpdateAdminPassword = async (e) => {
    e.preventDefault();
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPasswordError('New passwords do not match');
      return;
    }
    setSavingAdminPassword(true);
    setAdminPasswordError('');
    setAdminPasswordSuccess('');
    try {
      await api.admin.account.updatePassword({
        currentPassword: adminOldPassword,
        newPassword: adminNewPassword,
        confirmPassword: adminConfirmPassword,
      });
      setAdminPasswordSuccess('Admin password changed successfully!');
      setAdminOldPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err) {
      setAdminPasswordError(err.response?.data?.message || err.message || 'Failed to update admin password');
    } finally {
      setSavingAdminPassword(false);
    }
  };

  // Open right drawer to create new field
  const handleOpenCreateDrawer = () => {
    setEditingField(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldRefId('');
    setFieldRequired(false);
    setFieldUnique(false);
    setFieldDescription('');
    setFieldSection(selectedSectionId === 'all' ? 'contact' : selectedSectionId);
    setShowFieldDrawer(true);
  };

  // Open right drawer to edit existing field
  const handleOpenEditDrawer = (field) => {
    setEditingField(field);
    setFieldLabel(field.label);
    setFieldType(field.fieldType || 'text');
    setFieldRefId(field.name);
    setFieldRequired(Boolean(field.isRequired));
    setFieldUnique(Boolean(field.validationRules?.isUnique));
    setFieldDescription(field.description || '');
    setFieldSection(field.validationRules?.section || 'contact');
    setActiveActionMenuId(null);
    setShowFieldDrawer(true);
  };

  // Save / Submit field (Create or Edit)
  const handleSaveField = async (e) => {
    e.preventDefault();
    try {
      const generatedName = (fieldRefId || fieldLabel)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '') || `field_${Date.now()}`;

      const payload = {
        label: fieldLabel,
        name: generatedName,
        fieldType: fieldType,
        isRequired: fieldRequired,
        description: fieldDescription,
        validationRules: {
          section: fieldSection,
          isUnique: fieldUnique,
        },
      };

      if (editingField && editingField.id && !editingField.id.startsWith('f-')) {
        await api.fields.update(editingField.id, payload);
      } else {
        await api.fields.create(payload);
      }

      setShowFieldDrawer(false);
      await loadAllAdminData();
    } catch (err) {
      console.error('Failed to save field to database:', err);
      alert('Error saving field to database: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;
    setActiveActionMenuId(null);
    try {
      if (!id.startsWith('f-')) {
        await api.fields.delete(id);
      }
      setFieldsList(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setFieldsList(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleDuplicateField = async (field) => {
    setActiveActionMenuId(null);
    try {
      await api.fields.create({
        label: `${field.label} (Copy)`,
        name: `${field.name}_copy_${Date.now().toString().slice(-4)}`,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        description: field.description,
        validationRules: field.validationRules || {},
      });
      await loadAllAdminData();
    } catch (err) {
      alert(`Error duplicating field: ${err.message}`);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    try {
      const res = await api.fields.createSection({ name: newSectionName.trim() });
      const created = res?.data;
      if (created) {
        setSections(prev => {
          if (prev.some(s => s.id === created.id)) return prev;
          return [...prev, created];
        });
        setSelectedSectionId(created.id);
      }
      setNewSectionName('');
      setShowAddSectionModal(false);
      loadAllAdminData();
    } catch (err) {
      console.error('Failed to create section:', err);
      alert('Error creating section: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteSection = async (e, sectionId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this section? Any fields inside will remain in "All Fields".')) return;
    try {
      await api.fields.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      if (selectedSectionId === sectionId) {
        setSelectedSectionId('all');
      }
    } catch (err) {
      alert(`Error deleting section: ${err.message}`);
    }
  };

  const handleCreatePipeline = async (e) => {
    e.preventDefault();
    try {
      await api.pipelines.create({
        name: newPipelineName,
        description: newPipelineDesc,
      });
      setShowNewPipelineModal(false);
      setNewPipelineName('');
      setNewPipelineDesc('');
      loadAllAdminData();
    } catch (err) {
      alert(`Error creating pipeline: ${err.message}`);
    }
  };

  const handleDuplicatePipeline = async (id) => {
    try {
      await api.pipelines.duplicate(id);
      loadAllAdminData();
    } catch (err) {
      alert(`Error duplicating: ${err.message}`);
    }
  };

  const togglePermission = (roleName, action) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        [action]: !prev[roleName]?.[action],
      },
    }));
  };

  // Helper to format field type nicely
  const formatFieldType = (type) => {
    switch (type) {
      case 'text': return 'Plain Text';
      case 'number': return 'Number';
      case 'dropdown': return 'Dropdown Selection';
      case 'phone': return 'Phone Number';
      case 'email': return 'Email';
      case 'date': return 'Date';
      case 'boolean': return 'Boolean';
      case 'rich_text': return 'Rich Text';
      case 'file': return 'File Upload';
      default: return type || 'Plain Text';
    }
  };

  // Filter fields based on selected section and search
  const filteredFields = fieldsList.filter(f => {
    const sec = f.validationRules?.section || 'contact';
    const matchesSection = selectedSectionId === 'all' || sec === selectedSectionId;
    const matchesSearch = !searchQuery || 
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  // Calculate field counts per section
  const getSectionCount = (sectionId) => {
    if (sectionId === 'all') return fieldsList.length;
    return fieldsList.filter(f => (f.validationRules?.section || 'contact') === sectionId).length;
  };

  const currentSectionName = sections.find(s => s.id === selectedSectionId)?.name || 'Fields';

  // Filter users based on search and faceted filters
  const filteredUsers = usersList.filter(u => {
    const q = userSearch.trim().toLowerCase();
    const matchesSearch = !q || 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q));

    const matchesType = userTypeFilter === 'all' || 
      (u.userType && u.userType.toLowerCase() === userTypeFilter.toLowerCase());

    const matchesRole = roleFilter === 'all' || 
      (u.roles && u.roles.some(r => (r.name || '').toLowerCase() === roleFilter.toLowerCase()));

    const matchesBranch = branchFilter === 'all' || 
      u.branchId === branchFilter || 
      (u.branchName && u.branchName.toLowerCase() === branchFilter.toLowerCase());

    const matchesDept = departmentFilter === 'all' || 
      u.departmentId === departmentFilter || 
      (u.departmentName && u.departmentName.toLowerCase() === departmentFilter.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? u.isActive !== false : u.isActive === false);

    return matchesSearch && matchesType && matchesRole && matchesBranch && matchesDept && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Top Configuration Tabs */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '2px', height: '100%' }}>
          {[
            { id: 'fields', label: 'Template & Custom Fields', icon: Layers },
            { id: 'pipelines', label: 'Pipelines & Stages', icon: GitBranch },
            { id: 'roles', label: 'Role & Permission Matrix', icon: ShieldCheck },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'security', label: 'Security & Admin Account', icon: KeyRound },
            { id: 'branches', label: 'Campuses & Schools', icon: Building2 },
            { id: 'audit', label: 'Audit Trail', icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  height: '100%',
                }}
              >
                <Icon size={14} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TEMPLATE & CUSTOM FIELDS — EXACT 3-PANEL ENTERPRISE SAAS REFERENCE */}
      {/* ========================================================================= */}
      {activeTab === 'fields' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* SECONDARY PANEL: CONFIGURATION NAVIGATION */}
          <div style={{
            width: '240px',
            background: '#FFFFFF',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 10px',
            flexShrink: 0,
            overflowY: 'auto',
          }}>
            <div style={{
              fontSize: '0.675rem',
              fontWeight: 600,
              color: 'var(--text-dim)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '0 8px 10px 8px',
            }}>
              Sections
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              {sections.map(sec => {
                const isSelected = selectedSectionId === sec.id;
                const count = getSectionCount(sec.id);
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-light)' : 'transparent',
                      border: isSelected ? '1px solid var(--accent-border)' : '1px solid transparent',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 600 : 400,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{sec.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-dim)',
                        fontWeight: 600,
                      }}>
                        {count}
                      </span>
                      {!['all', 'contact', 'basic'].includes(sec.id) && (
                        <span
                          onClick={(e) => handleDeleteSection(e, sec.id)}
                          title="Delete section"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '2px',
                            borderRadius: '3px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Trash2 size={12} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setShowAddSectionModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  marginTop: '8px',
                  background: 'transparent',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.785rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                <span>Add Section</span>
              </button>
            </div>

            {/* Template config footer action */}
            <div style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--border-light)',
              marginTop: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Settings size={13} />
                <span>Template Configuration</span>
              </div>
            </div>
          </div>

          {/* MAIN WORKSPACE */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            position: 'relative',
          }}>
            {/* Page Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Fields Configuration
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Manage and structure custom metadata attributes for application forms.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input
                  type="text"
                  placeholder="Search fields..."
                  className="input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.785rem' }}
                />
              </div>
            </div>

            {/* Section Heading & + Add Field Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {currentSectionName}
                </h2>
                <span className="badge badge-gray">{filteredFields.length} fields</span>
              </div>

              <button onClick={handleOpenCreateDrawer} className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>Add Field</span>
              </button>
            </div>

            {/* Enterprise Field Table / List */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-xs)',
              overflow: 'visible',
            }}>
              {/* Table Column Headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr 60px',
                padding: '10px 16px',
                background: '#F8FAFC',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.725rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}>
                <div>Label</div>
                <div>Field Type</div>
                <div>Reference ID</div>
                <div>Unique</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>

              {/* Rows */}
              {filteredFields.length === 0 ? (
                <div style={{
                  padding: '48px 16px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <FileText size={22} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    No custom fields configured
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
                    Create fields for your processes.
                  </p>
                  <button onClick={handleOpenCreateDrawer} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                    <Plus size={14} />
                    <span>+ Create Field</span>
                  </button>
                </div>
              ) : (
                filteredFields.map(field => {
                  const isMenuOpen = activeActionMenuId === field.id;
                  const isUnique = Boolean(field.validationRules?.isUnique);

                  return (
                    <div
                      key={field.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr 60px',
                        padding: '12px 16px',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border-light)',
                        background: '#FFFFFF',
                        fontSize: '0.8125rem',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      {/* Label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {field.label}
                        </span>
                        {field.isRequired && (
                          <span className="badge badge-amber" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                            Required
                          </span>
                        )}
                      </div>

                      {/* Field Type */}
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {formatFieldType(field.fieldType)}
                      </div>

                      {/* Reference ID */}
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {field.name}
                      </div>

                      {/* Unique Status */}
                      <div>
                        {isUnique ? (
                          <span className="badge badge-green">Yes</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No</span>
                        )}
                      </div>

                      {/* Three-Dot Actions Menu */}
                      <div style={{ textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveActionMenuId(isMenuOpen ? null : field.id)}
                          className="btn btn-secondary btn-icon"
                          style={{ border: 'none', background: 'transparent', padding: '4px' }}
                        >
                          <MoreVertical size={16} color="var(--text-muted)" />
                        </button>

                        {isMenuOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              right: 0,
                              width: '140px',
                              background: '#FFFFFF',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              boxShadow: 'var(--shadow-md)',
                              padding: '4px',
                              zIndex: 60,
                              textAlign: 'left',
                            }}
                          >
                            <button
                              onClick={() => handleOpenEditDrawer(field)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 10px',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '0.75rem',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                borderRadius: '4px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDuplicateField(field)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 10px',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '0.75rem',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                borderRadius: '4px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 10px',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '0.75rem',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                borderRadius: '4px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PIPELINES & STAGES */}
      {/* ========================================================================= */}
      {activeTab === 'pipelines' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Configured Pipelines & Stages
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Define lifecycle pipelines and sequence stages without code changes.
              </p>
            </div>
            <button onClick={() => setShowNewPipelineModal(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> + New Pipeline
            </button>
          </div>

          {pipelinesList.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', background: '#FFFFFF' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Layers size={26} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                No pipelines configured
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 18px 0' }}>
                Create your first pipeline.
              </p>
              <button onClick={() => setShowNewPipelineModal(true)} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                <Plus size={14} />
                <span>+ Create Pipeline</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pipelinesList.map(p => (
                <div key={p.id} className="glass-panel" style={{ padding: '20px 24px', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--text-main)' }}>{p.name}</span>
                        <span className="badge badge-purple">{p.entityType || 'request'}</span>
                      </div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {p.description || 'Configurable pipeline process'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDuplicatePipeline(p.id)} className="btn btn-secondary btn-sm" title="Duplicate Pipeline">
                        <Copy size={13} /> Duplicate
                      </button>
                    </div>
                  </div>

                  {/* Stage Sequence Flow */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflowX: 'auto',
                  }}>
                    {p.stages && p.stages.length > 0 ? (
                      p.stages.map((stg, i, arr) => (
                        <React.Fragment key={stg.id || stg.name || i}>
                          <div style={{
                            padding: '6px 12px',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            borderLeft: `3px solid ${stg.color || '#3B82F6'}`,
                          }}>
                            {stg.name}
                          </div>
                          {i < arr.length - 1 && <ArrowRight size={13} color="var(--text-dim)" />}
                        </React.Fragment>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        No stages configured for this pipeline yet.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROLE & PERMISSION MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Institutional Authorization Matrix
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Grant or restrict operational capabilities for roles across the platform.
            </p>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-xs)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>ROLE NAME</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>VIEW</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>CREATE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>EDIT</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>DELETE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>APPROVE</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionMatrix).map(([roleName, perms]) => (
                  <tr key={roleName} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-main)' }}>
                      {roleName}
                    </td>
                    {['view', 'create', 'edit', 'delete', 'approve'].map(action => (
                      <td key={action} style={{ padding: '14px 18px' }}>
                        <button
                          onClick={() => togglePermission(roleName, action)}
                          style={{
                            background: perms[action] ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                            border: `1px solid ${perms[action] ? '#A7F3D0' : '#FECACA'}`,
                            color: perms[action] ? '#047857' : '#B91C1C',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {perms[action] ? <Check size={12} /> : <XCircle size={12} />}
                          <span>{perms[action] ? 'Allowed' : 'Denied'}</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CAMPUSES & SCHOOLS */}
      {/* ========================================================================= */}
      {activeTab === 'branches' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Campuses & Institutional Hierarchy
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Academic branches and schools configured in Apex Institute.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF' }}>
              <span className="badge badge-blue">Main Campus</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
                North Valley Main Campus
              </h3>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Academic Boulevard, Sector 4, Silicon Valley Corridor
              </p>
              <div style={{ marginTop: '12px', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                Schools: Computer Science, Business & Management, Applied Sciences
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Configuration Audit Trail
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Immutable record of all modifications made to metadata, pipelines, and roles.
            </p>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-xs)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>TIMESTAMP</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>ACTION</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>ENTITY TYPE</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>MODIFIED BY</th>
                </tr>
              </thead>
              <tbody>
                {auditLogsList.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No recent audit entries recorded
                    </td>
                  </tr>
                ) : (
                  auditLogsList.map((log, idx) => (
                    <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{log.action}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-purple">{log.entityType}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {log.userName || 'System Automation'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USERS DIRECTORY TAB PANEL */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* USERS DIRECTORY & ACCESS GOVERNANCE TAB PANEL */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  User & Access Management
                </h2>
                <span className="badge badge-blue" style={{ fontSize: '0.725rem' }}>
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Configure institutional identities, manage Student vs Management roles, assign branches, and govern portal access.
              </p>
            </div>
            <button
              onClick={() => {
                setNewUserType('Student');
                setNewUserRole('Student');
                setNewUserName('');
                setNewUserEmail('');
                setNewUserPhone('');
                setNewUserPassword('CampusPass@2026!');
                setNewUserBranch('');
                setNewUserDepartment('');
                setNewUserActive(true);
                setCreateUserError('');
                setShowCreateUserModal(true);
              }}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', padding: '8px 14px' }}
            >
              <Plus size={15} />
              <span>Add User</span>
            </button>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="card" style={{ padding: '14px 16px', marginBottom: '16px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  className="input"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.8rem', height: '34px' }}
                />
              </div>

              {/* User Type filter */}
              <div style={{ minWidth: '130px' }}>
                <select
                  className="select"
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', height: '34px' }}
                >
                  <option value="all">Type: All</option>
                  <option value="Student">Student</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              {/* Role filter */}
              <div style={{ minWidth: '140px' }}>
                <select
                  className="select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', height: '34px' }}
                >
                  <option value="all">Role: All</option>
                  {rolesList.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Branch filter */}
              <div style={{ minWidth: '140px' }}>
                <select
                  className="select"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', height: '34px' }}
                >
                  <option value="all">Branch: All</option>
                  {branchesList.map(b => (
                    <option key={b.id} value={b.id}>{b.name || b.code}</option>
                  ))}
                </select>
              </div>

              {/* Department filter */}
              <div style={{ minWidth: '140px' }}>
                <select
                  className="select"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', height: '34px' }}
                >
                  <option value="all">Dept: All</option>
                  {departmentsList.map(d => (
                    <option key={d.id} value={d.id}>{d.name || d.code}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div style={{ minWidth: '120px' }}>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', height: '34px' }}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(userSearch || userTypeFilter !== 'all' || roleFilter !== 'all' || branchFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setUserSearch('');
                    setUserTypeFilter('all');
                    setRoleFilter('all');
                    setBranchFilter('all');
                    setDepartmentFilter('all');
                    setStatusFilter('all');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', height: '34px', gap: '4px' }}
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="card" style={{ padding: 0, overflow: 'visible', background: '#FFFFFF' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>User Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Branch</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Created At</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                      <div>Loading user directory...</div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '48px 24px', textAlign: 'center' }}>
                      {usersList.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '12px',
                          }}>
                            <Users size={24} />
                          </div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                            No users yet
                          </h3>
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                            Create users and assign their roles and access.
                          </p>
                          <button
                            onClick={() => {
                              setNewUserType('Student');
                              setNewUserRole('Student');
                              setNewUserName('');
                              setNewUserEmail('');
                              setNewUserPhone('');
                              setNewUserPassword('CampusPass@2026!');
                              setNewUserBranch('');
                              setNewUserDepartment('');
                              setNewUserActive(true);
                              setCreateUserError('');
                              setShowCreateUserModal(true);
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ gap: '6px' }}
                          >
                            <Plus size={14} />
                            <span>Add User</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
                          No matching users found for current filter criteria.
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isStudent = (u.userType || '').toLowerCase() === 'student' || (u.roles || []).some(r => (r.name || '').toLowerCase() === 'student');
                    const primaryRole = u.roles?.[0]?.name || (isStudent ? 'Student' : 'User');
                    const isMenuOpen = activeUserMenuId === u.id;

                    return (
                      <tr 
                        key={u.id} 
                        style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                        onClick={() => handleOpenUserDetails(u)}
                      >
                        {/* Name & Phone */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isStudent ? '#E0F2FE' : '#EEF2FF',
                              color: isStudent ? '#0284C7' : '#4F46E5',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                              {u.phone && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Phone size={10} />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {u.email}
                        </td>

                        {/* User Type */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            background: isStudent ? '#E0F2FE' : '#EDE9FE',
                            color: isStudent ? '#0369A1' : '#6D28D9',
                          }}>
                            {isStudent ? 'Student' : 'Management'}
                          </span>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-blue">
                            {primaryRole}
                          </span>
                        </td>

                        {/* Branch */}
                        <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                          {u.branchName || '—'}
                        </td>

                        {/* Department */}
                        <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                          {u.departmentName || '—'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: u.isActive !== false ? '#16A34A' : '#DC2626',
                          }}>
                            {u.isActive !== false ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            <span>{u.isActive !== false ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>

                        {/* Created At */}
                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px', textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveUserMenuId(isMenuOpen ? null : u.id)}
                            className="btn btn-secondary btn-icon"
                            style={{ padding: '4px 6px', background: isMenuOpen ? '#F1F5F9' : 'transparent' }}
                            title="Actions"
                          >
                            <MoreVertical size={15} />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div style={{
                              position: 'absolute',
                              right: '16px',
                              top: '40px',
                              width: '180px',
                              background: '#FFFFFF',
                              borderRadius: '8px',
                              boxShadow: 'var(--shadow-lg)',
                              border: '1px solid var(--border-subtle)',
                              zIndex: 50,
                              padding: '4px 0',
                              textAlign: 'left',
                            }}>
                              <button
                                onClick={() => handleOpenUserDetails(u)}
                                style={{
                                  width: '100%',
                                  padding: '8px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'transparent',
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer',
                                }}
                              >
                                <Eye size={13} color="var(--accent-primary)" />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditUser(u)}
                                style={{
                                  width: '100%',
                                  padding: '8px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'transparent',
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer',
                                }}
                              >
                                <Edit3 size={13} color="#475569" />
                                <span>Edit Profile</span>
                              </button>

                              <button
                                onClick={() => handleOpenChangeRole(u)}
                                style={{
                                  width: '100%',
                                  padding: '8px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'transparent',
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer',
                                }}
                              >
                                <ShieldCheck size={13} color="#7C3AED" />
                                <span>Change Role</span>
                              </button>

                              <button
                                onClick={() => handleOpenResetPassword(u)}
                                style={{
                                  width: '100%',
                                  padding: '8px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'transparent',
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer',
                                }}
                              >
                                <KeyRound size={13} color="#D97706" />
                                <span>Reset Password</span>
                              </button>

                              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />

                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                style={{
                                  width: '100%',
                                  padding: '8px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'transparent',
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  color: u.isActive !== false ? '#DC2626' : '#16A34A',
                                  cursor: 'pointer',
                                }}
                              >
                                {u.isActive !== false ? (
                                  <>
                                    <UserX size={13} color="#DC2626" />
                                    <span>Deactivate User</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={13} color="#16A34A" />
                                    <span>Activate User</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECURITY & ADMIN ACCOUNT TAB PANEL */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
              Security & Credential Management
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Manage credentials used to access the Admin Portal, update system emails, and audit authentication identities.
            </p>
          </div>

          {/* Bootstrap Development Admin Notice */}
          {adminAccount?.isBootstrapAdmin && (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <AlertTriangle size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.875rem' }}>
                  Temporary Development Admin Account Active
                </div>
                <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '2px' }}>
                  This account was initialized for initial system setup and bootstrapping. For production security, update your administrator email and password below. The system password is never exposed in the interface or database.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* Super Admin Profile Overview Card */}
            <div className="card" style={{ background: '#FFFFFF', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Shield size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Admin Account Profile
                </h3>
              </div>

              {loadingAdminAccount ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading account profile...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Account Name:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{adminAccount?.name || 'Administrator'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Portal Email:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{adminAccount?.email || user?.email || 'admin@campusflow.local'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Security Role:</span>
                    <span className="badge badge-blue">Super Admin</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span style={{ color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Active
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Password:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                      ••••••••••••••••
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Change Admin Email Card */}
            <div className="card" style={{ background: '#FFFFFF', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Mail size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Change Admin Login Email
                </h3>
              </div>

              {adminEmailSuccess && (
                <div style={{ padding: '8px 12px', background: '#DCFCE7', color: '#15803D', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                  {adminEmailSuccess}
                </div>
              )}
              {adminEmailError && (
                <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                  {adminEmailError}
                </div>
              )}

              <form onSubmit={handleUpdateAdminEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="label">New Admin Email *</label>
                  <input
                    type="email"
                    className="input"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder="new.admin@campusflow.local"
                    required
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingAdminEmail || adminEmailInput === adminAccount?.email}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {savingAdminEmail ? 'Updating Email...' : 'Update Admin Email'}
                </button>
              </form>
            </div>

            {/* Change Admin Password Card */}
            <div className="card" style={{ background: '#FFFFFF', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <KeyRound size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Change Admin Password
                </h3>
              </div>

              {adminPasswordSuccess && (
                <div style={{ padding: '8px 12px', background: '#DCFCE7', color: '#15803D', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                  {adminPasswordSuccess}
                </div>
              )}
              {adminPasswordError && (
                <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                  {adminPasswordError}
                </div>
              )}

              <form onSubmit={handleUpdateAdminPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="label">Current Password *</label>
                  <input
                    type="password"
                    className="input"
                    value={adminOldPassword}
                    onChange={(e) => setAdminOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label">New Password *</label>
                    <input
                      type="password"
                      className="input"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      style={{ width: '100%', fontSize: '0.825rem' }}
                    />
                  </div>
                  <div>
                    <label className="label">Confirm New Password *</label>
                    <input
                      type="password"
                      className="input"
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      required
                      minLength={6}
                      style={{ width: '100%', fontSize: '0.825rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingAdminPassword || !adminOldPassword || !adminNewPassword}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {savingAdminPassword ? 'Updating Password...' : 'Update Admin Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER DETAILS SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      {showUserDetailsDrawer && selectedUserForDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 100,
          }}
          onClick={() => setShowUserDetailsDrawer(false)}
        >
          <div
            style={{
              width: '460px',
              maxWidth: '100%',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-drawer)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 101,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  User Profile & Governance
                </h3>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ID: {selectedUserForDetails.id}
                </div>
              </div>
              <button
                onClick={() => setShowUserDetailsDrawer(false)}
                className="btn btn-secondary btn-icon"
                style={{ border: 'none', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Profile Card */}
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: (selectedUserForDetails.userType || '').toLowerCase() === 'student' ? '#E0F2FE' : '#EDE9FE',
                    color: (selectedUserForDetails.userType || '').toLowerCase() === 'student' ? '#0369A1' : '#6D28D9',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {(selectedUserForDetails.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {selectedUserForDetails.name}
                    </h4>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {selectedUserForDetails.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.775rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Phone</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedUserForDetails.phone || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Status</div>
                    <div style={{ fontWeight: 600, color: selectedUserForDetails.isActive !== false ? '#16A34A' : '#DC2626' }}>
                      {selectedUserForDetails.isActive !== false ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>User Type</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedUserForDetails.userType || 'Management'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Primary Role</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {selectedUserForDetails.roles?.[0]?.name || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portal Access Architecture Card */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  Access Control & Routing
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.775rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Branch:</span>
                    <span style={{ fontWeight: 600 }}>{selectedUserForDetails.branchName || selectedUserForDetails.branchId || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Department:</span>
                    <span style={{ fontWeight: 600 }}>{selectedUserForDetails.departmentName || selectedUserForDetails.departmentId || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Target Portal Route:</span>
                    <span className="badge badge-purple" style={{ fontWeight: 600 }}>
                      {(selectedUserForDetails.userType || '').toLowerCase() === 'student' ? 'Student Agent (/student)' :
                       (selectedUserForDetails.roles || []).some(r => r.name === 'Super Admin') ? 'Admin Portal (/admin)' :
                       'Management Agent (/management)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  Administrative Actions
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEditUser(selectedUserForDetails)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', justifyContent: 'center' }}
                  >
                    <Edit3 size={13} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => handleOpenChangeRole(selectedUserForDetails)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', justifyContent: 'center' }}
                  >
                    <ShieldCheck size={13} />
                    <span>Change Role</span>
                  </button>
                  <button
                    onClick={() => handleOpenResetPassword(selectedUserForDetails)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', justifyContent: 'center' }}
                  >
                    <KeyRound size={13} />
                    <span>Reset Password</span>
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(selectedUserForDetails)}
                    className={selectedUserForDetails.isActive !== false ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                    style={{ gap: '6px', justifyContent: 'center' }}
                  >
                    {selectedUserForDetails.isActive !== false ? <UserX size={13} /> : <UserCheck size={13} />}
                    <span>{selectedUserForDetails.isActive !== false ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>

              {/* Recent Audit Log History for this user */}
              <div style={{ marginTop: '6px' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  Activity Audit Trail
                </h5>
                {loadingUserDetails ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '12px' }}>
                    Loading audit trail...
                  </div>
                ) : (selectedUserForDetails.auditLogs || []).length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '12px', textAlign: 'center', background: '#F8FAFC', borderRadius: '6px' }}>
                    No audit entries found for this user.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedUserForDetails.auditLogs.map((log, idx) => (
                      <div key={log.id || idx} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.action}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD USER MODAL */}
      {/* ========================================================================= */}
      {showCreateUserModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Create User Account
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Register student or institutional management account with credentials
                </div>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="btn btn-secondary btn-icon" style={{ border: 'none', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {createUserError && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '14px' }}>
                {createUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* STEP 1: USER TYPE SEGMENTED SELECTOR */}
              <div>
                <label className="label" style={{ marginBottom: '6px' }}>
                  User Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUserType('Student');
                      setNewUserRole('Student');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: newUserType === 'Student' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: newUserType === 'Student' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: newUserType === 'Student' ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                      🎓 Student
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Accesses Student Agent for requests & AI chat
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewUserType('Management');
                      const firstMgmtRole = rolesList.find(r => r.name !== 'Student')?.name || 'Admission Officer';
                      setNewUserRole(firstMgmtRole);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: newUserType === 'Management' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: newUserType === 'Management' ? '#F5F3FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: newUserType === 'Management' ? '#7C3AED' : 'var(--text-main)' }}>
                      🏛️ Management
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Accesses Management Agent or Admin Portal
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 2: ROLE ASSIGNMENT */}
              <div>
                <label className="label">
                  Assigned Institutional Role *
                </label>
                {newUserType === 'Student' ? (
                  <div style={{
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Student</span>
                    <span style={{ fontSize: '0.72rem', color: '#0369A1' }}>Locked for Student Identity</span>
                  </div>
                ) : (
                  <select
                    className="select"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                    required
                  >
                    {rolesList
                      .filter(r => r.name !== 'Student')
                      .map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    {rolesList.length === 0 && (
                      <>
                        <option value="Admission Officer">Admission Officer</option>
                        <option value="Dean">Dean</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Super Admin">Super Admin</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* STEP 3: BASIC INFORMATION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Full Name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 98765 43210"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="label">Login Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="user@campusflow.edu"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '0.825rem' }}
                />
              </div>

              {/* STEP 4: BRANCH & DEPARTMENT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label">Branch / Campus</label>
                  <select
                    className="select"
                    value={newUserBranch}
                    onChange={(e) => setNewUserBranch(e.target.value)}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  >
                    <option value="">None / Global</option>
                    {branchesList.map(b => (
                      <option key={b.id} value={b.id}>{b.name || b.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select
                    className="select"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  >
                    <option value="">None / General</option>
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name || d.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 5: CREDENTIALS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label">Temporary Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordPlain(!showPasswordPlain)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                  >
                    {showPasswordPlain ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPasswordPlain ? 'text' : 'password'}
                  className="input"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: '100%', fontSize: '0.825rem' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Passwords are sent securely to authentication provider and never stored in application database.
                </div>
              </div>

              {/* STATUS & MUST CHANGE PASSWORD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="newUserActive"
                    checked={newUserActive}
                    onChange={(e) => setNewUserActive(e.target.checked)}
                    style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <label htmlFor="newUserActive" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    Activate Account Immediately
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="newUserMustChange"
                    checked={newUserMustChangePassword}
                    onChange={(e) => setNewUserMustChangePassword(e.target.checked)}
                    style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <label htmlFor="newUserMustChange" style={{ fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
                    Require password change on first login
                  </label>
                </div>
              </div>

              {/* SUBMIT BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="btn btn-secondary"
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {showEditUserModal && editingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Edit User Profile
              </h3>
              <button onClick={() => setShowEditUserModal(false)} className="btn btn-secondary btn-icon" style={{ border: 'none', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {editUserError && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                {editUserError}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '0.825rem' }}
                />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', fontSize: '0.825rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label">Branch / Campus</label>
                  <select
                    className="select"
                    value={editUserBranch}
                    onChange={(e) => setEditUserBranch(e.target.value)}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  >
                    <option value="">None</option>
                    {branchesList.map(b => (
                      <option key={b.id} value={b.id}>{b.name || b.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Department</label>
                  <select
                    className="select"
                    value={editUserDepartment}
                    onChange={(e) => setEditUserDepartment(e.target.value)}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  >
                    <option value="">None</option>
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name || d.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="editUserActive"
                  checked={editUserActive}
                  onChange={(e) => setEditUserActive(e.target.checked)}
                  style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                />
                <label htmlFor="editUserActive" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  Account is Active
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="btn btn-secondary"
                  disabled={savingEditUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEditUser}
                >
                  {savingEditUser ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHANGE ROLE MODAL */}
      {/* ========================================================================= */}
      {showChangeRoleModal && changingRoleUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Change User Role
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {changingRoleUser.name} ({changingRoleUser.email})
                </div>
              </div>
              <button onClick={() => setShowChangeRoleModal(false)} className="btn btn-secondary btn-icon" style={{ border: 'none', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {changeRoleError && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                {changeRoleError}
              </div>
            )}

            {/* Super Admin Protection Advisory */}
            {(changingRoleUser.roles || []).some(r => r.name === 'Super Admin') && (
              <div style={{ padding: '8px 12px', background: '#FEF3C7', color: '#92400E', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '12px' }}>
                ⚠️ Notice: If this is the last active Super Admin account, demoting it will be blocked by backend governance rules.
              </div>
            )}

            <form onSubmit={handleSaveChangeRole} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Target Role *</label>
                <select
                  className="select"
                  value={changeRoleSelected}
                  onChange={(e) => setChangeRoleSelected(e.target.value)}
                  style={{ width: '100%', fontSize: '0.825rem' }}
                  required
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Assigning "Student" routes to Student Agent. Management roles route to Management Agent.
                </div>
              </div>

              <div>
                <label className="label">Branch Association</label>
                <select
                  className="select"
                  value={changeRoleBranch}
                  onChange={(e) => setChangeRoleBranch(e.target.value)}
                  style={{ width: '100%', fontSize: '0.825rem' }}
                >
                  <option value="">Institution-wide</option>
                  {branchesList.map(b => (
                    <option key={b.id} value={b.id}>{b.name || b.code}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowChangeRoleModal(false)}
                  className="btn btn-secondary"
                  disabled={savingChangeRole}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingChangeRole}
                >
                  {savingChangeRole ? 'Updating Role...' : 'Confirm Role Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET USER PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showResetPasswordModal && resetPasswordUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Administrative Password Reset
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {resetPasswordUser.name} ({resetPasswordUser.email})
                </div>
              </div>
              <button onClick={() => setShowResetPasswordModal(false)} className="btn btn-secondary btn-icon" style={{ border: 'none', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {resetPasswordError && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                {resetPasswordError}
              </div>
            )}

            {resetPasswordSuccessResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  padding: '16px',
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', fontWeight: 700, fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Password Successfully Reset</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '6px' }}>
                    The user's authentication identity was updated. Provide this temporary password to the user:
                  </div>

                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: '#FFFFFF',
                    borderRadius: '6px',
                    border: '1px solid #86EFAC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <code style={{ fontSize: '0.9rem', fontWeight: 700, color: '#15803D' }}>
                      {resetPasswordSuccessResult}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetPasswordSuccessResult);
                        setCopiedTempPassword(true);
                        setTimeout(() => setCopiedTempPassword(false), 2000);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
                    >
                      {copiedTempPassword ? <Check size={12} color="#15803D" /> : <Copy size={12} />}
                      <span>{copiedTempPassword ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  This will immediately invalidate the user's existing login credentials in the authentication provider and set a new temporary password.
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="label" style={{ margin: 0 }}>New Temporary Password *</label>
                    <button
                      type="button"
                      onClick={() => setResetPasswordInput('CampusPass@' + Math.floor(1000 + Math.random() * 9000))}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                    >
                      Generate Random
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input"
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    required
                    minLength={6}
                    style={{ width: '100%', fontSize: '0.825rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(false)}
                    className="btn btn-secondary"
                    disabled={savingResetPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingResetPassword || !resetPasswordInput}
                  >
                    {savingResetPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RIGHT-SIDE SLIDE-OVER DRAWER FOR CREATE / EDIT FIELD (EXACT SECTION 12 UI) */}
      {/* ========================================================================= */}
      {showFieldDrawer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100,
        }}
        onClick={() => setShowFieldDrawer(false)}
        >
          <div
            style={{
              width: '420px',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-drawer)',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              zIndex: 101,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {editingField ? 'Edit Field' : 'Create Field'}
                </h3>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Section: {currentSectionName}
                </div>
              </div>
              <button
                onClick={() => setShowFieldDrawer(false)}
                className="btn btn-secondary btn-icon"
                style={{ border: 'none', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSaveField} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Field Label */}
                <div>
                  <label className="label">Field Label</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Phone Number"
                    value={fieldLabel}
                    onChange={(e) => {
                      setFieldLabel(e.target.value);
                      if (!fieldRefId && !editingField) {
                        setFieldRefId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                      }
                    }}
                    required
                  />
                </div>

                {/* Field Type */}
                <div>
                  <label className="label">Field Type</label>
                  <select
                    className="select"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                  >
                    <option value="text">Plain Text</option>
                    <option value="number">Number</option>
                    <option value="phone">Phone Number</option>
                    <option value="email">Email</option>
                    <option value="dropdown">Dropdown Selection</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                    <option value="rich_text">Rich Text</option>
                    <option value="file">File Upload</option>
                  </select>
                </div>

                {/* Reference ID */}
                <div>
                  <label className="label">Reference ID</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. phone_number"
                    value={fieldRefId}
                    onChange={(e) => setFieldRefId(e.target.value)}
                    required
                  />
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Unique machine identifier used in database and API payloads.
                  </div>
                </div>

                {/* Section selection */}
                <div>
                  <label className="label">Section Group</label>
                  <select
                    className="select"
                    value={fieldSection}
                    onChange={(e) => setFieldSection(e.target.value)}
                  >
                    {sections.filter(s => s.id !== 'all').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle Controls: Required & Unique */}
                <div style={{
                  padding: '14px',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)' }}>Required</span>
                    <input
                      type="checkbox"
                      checked={fieldRequired}
                      onChange={(e) => setFieldRequired(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)' }}>Unique</span>
                    <input
                      type="checkbox"
                      checked={fieldUnique}
                      onChange={(e) => setFieldUnique(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="label">Help Text / Description</label>
                  <textarea
                    className="textarea"
                    placeholder="Optional guidance shown to users in forms"
                    value={fieldDescription}
                    onChange={(e) => setFieldDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-subtle)',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowFieldDrawer(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ minWidth: '90px' }}
                >
                  {editingField ? 'Save Changes' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
        }}>
          <div style={{ width: '380px', background: '#FFFFFF', padding: '24px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
              Add Configuration Section
            </h3>
            <form onSubmit={handleAddSection}>
              <div style={{ marginBottom: '18px' }}>
                <label className="label">Section Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Identity & Credentials"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowAddSectionModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Pipeline Modal */}
      {showNewPipelineModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
        }}>
          <div style={{ width: '440px', background: '#FFFFFF', padding: '24px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              Create New Pipeline
            </h3>
            <form onSubmit={handleCreatePipeline}>
              <div style={{ marginBottom: '14px' }}>
                <label className="label">Pipeline Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Faculty Appraisal Pipeline"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label className="label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Purpose of this pipeline..."
                  value={newPipelineDesc}
                  onChange={(e) => setNewPipelineDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowNewPipelineModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
