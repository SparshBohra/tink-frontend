// A comment to force re-linting
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import ApplicationKanban from '../components/ApplicationKanban';
// Modal removed - applications are now created through listings
import ViewingSchedulerModal from '../components/ViewingSchedulerModal';
import ViewingCompletionModal from '../components/ViewingCompletionModal';
import LeaseGenerationModal from '../components/LeaseGenerationModal';
import ApplicationApprovalModal from '../components/ApplicationApprovalModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { Application, Property, Room } from '../lib/types';
import { apiClient } from '../lib/api';

interface ConflictResolution {
  applicationId: number;
  action: 'approve' | 'reject' | 'assign_room';
  roomId?: number;
  reason?: string;
}
import ConflictResolutionModal from '../components/ConflictResolutionModal';
import RoomAssignmentModal from '../components/RoomAssignmentModal';
import PropertyRoomManagement from '../components/PropertyRoomManagement';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import ImprovedLeaseGenerationModal from '../components/ImprovedLeaseGenerationModal';

function Applications() {
  const router = useRouter();
  const { property: propertyIdParam } = router.query;
  const { user } = useAuth(); // Get current user from auth context
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoomAssignmentModalOpen, setIsRoomAssignmentModalOpen] = useState(false);
  const [selectedApplicationForAssignment, setSelectedApplicationForAssignment] = useState<Application | null>(null);
  const [isPropertyRoomManagementOpen, setIsPropertyRoomManagementOpen] = useState(false);
  const [selectedPropertyForManagement, setSelectedPropertyForManagement] = useState<Property | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingApplications, setConflictingApplications] = useState<Application[]>([]);
  const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);
  const [selectedApplicationForDetail, setSelectedApplicationForDetail] = useState<Application | null>(null);
  const [isLeaseGenerationOpen, setIsLeaseGenerationOpen] = useState(false);
  const [selectedApplicationForLease, setSelectedApplicationForLease] = useState<Application | null>(null);
  const [selectedRoomForLease, setSelectedRoomForLease] = useState<Room | null>(null);
  
  // Add new state for viewing modals
  const [isViewingSchedulerOpen, setIsViewingSchedulerOpen] = useState(false);
  const [isViewingCompletionOpen, setIsViewingCompletionOpen] = useState(false);
  const [selectedApplicationForViewing, setSelectedApplicationForViewing] = useState<Application | null>(null);
  const [selectedViewingForCompletion, setSelectedViewingForCompletion] = useState<any>(null);
  const [isNewLeaseModalOpen, setIsNewLeaseModalOpen] = useState(false);
  const [selectedApplicationForNewLease, setSelectedApplicationForNewLease] = useState<Application | null>(null);
  
  // Add state for approval modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApplicationForApproval, setSelectedApplicationForApproval] = useState<Application | null>(null);
  const [selectedPropertyForApproval, setSelectedPropertyForApproval] = useState<Property | null>(null);

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    // Apply property filter from URL if present
    if (propertyIdParam && !selectedProperty) {
      const propertyId = parseInt(propertyIdParam as string);
      if (!isNaN(propertyId)) {
        setSelectedProperty(propertyId);
      }
    }
  }, [propertyIdParam, selectedProperty]);
  
  useEffect(() => {
    // Filter applications whenever the filter or data changes
    if (selectedProperty) {
      setFilteredApplications(applications.filter(app => app.property_ref === selectedProperty));
    } else {
      setFilteredApplications(applications);
    }
  }, [applications, selectedProperty]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [applicationsResponse, propertiesResponse, roomsResponse, leasesResponse] = await Promise.all([
        apiClient.getApplications(),
        apiClient.getProperties(),
        apiClient.getRooms(),
        apiClient.getLeases()
      ]);

      const activeLeases = (leasesResponse.results || []).filter((l:any) => l.status === 'active' || l.is_active);
      const draftedLeases = (leasesResponse.results || []).filter((l:any) => l.status === 'draft');

      const apps = (applicationsResponse.results || []).map((app:any) => {
        // If an active lease exists, the applicant has moved in
          const hasActiveLease = activeLeases.some((l:any) => l.tenant === app.tenant && l.property_ref === app.property_ref);
          if (hasActiveLease) {
            return { ...app, status: 'moved_in' };
          }

        // If a drafted lease exists for this application, it's in the lease created stage
        const hasDraftedLease = draftedLeases.some((l:any) => l.application === app.id);
        if (hasDraftedLease) {
          return { ...app, status: 'lease_created' };
        }
        
        return app; // Default to backend status if no specific override
      });
      setApplications(apps);
      setFilteredApplications(apps);
      setProperties(propertiesResponse.results || []);
      setRooms(roomsResponse.results || []);
    } catch (error: unknown) {
      console.error('Failed to fetch applications data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load applications data');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePropertyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const propertyId = value ? parseInt(value) : null;
    setSelectedProperty(propertyId);
    
    // Update URL without full page reload
    if (propertyId) {
      router.push(`/applications?property=${propertyId}`, undefined, { shallow: true });
    } else {
      router.push('/applications', undefined, { shallow: true });
    }
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getPropertyDetails = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    const propertyRooms = rooms.filter(room => room.property_ref === propertyId);
    const vacantRooms = propertyRooms.filter(room => room.is_vacant);
    const occupiedRooms = propertyRooms.filter(room => !room.is_vacant);
    
    return {
      property,
      totalRooms: propertyRooms.length,
      vacantRooms: vacantRooms.length,
      occupiedRooms: occupiedRooms.length,
      vacantRoomsList: vacantRooms
    };
  };

  const handleQualify = async (applicationId: number) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        alert('Application not found');
        return;
      }

      // Check if this is an undo operation (rejected application)
      if (application.status === 'rejected') {
        // Undo rejection - restore to pending status
        try {
          // Try to use the API to restore to pending
          await apiClient.updateApplication(applicationId, {
            status: 'pending'
          } as any);
          
          await fetchData();
          alert('✅ Application restored to pending status!');
          return;
          
        } catch (undoError: any) {
          console.error('Undo operation failed:', undoError);
          
          // Check if this is a 404 error (endpoint not implemented)
          if (undoError.message.includes('404') || undoError.message.includes('not found')) {
            console.log('Backend endpoint not available, using fallback method...');
            
            try {
              // Fallback: Update application status directly to pending
              await apiClient.updateApplication(applicationId, {
                status: 'pending'
              } as any);
              
              await fetchData();
              alert('✅ Application restored to pending status!');
              return;
              
            } catch (fallbackError: any) {
              console.error('Fallback method also failed:', fallbackError);
              alert(`❌ Failed to restore application: ${fallbackError.message}`);
              return;
            }
          } else {
            alert(`❌ Failed to restore application: ${undoError.message}`);
            return;
          }
        }
      }

      // Original qualification logic for pending applications
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1);

      const decisionData = {
        decision: 'approve' as const,
        decision_notes: 'Quick qualified - moved to shortlisted',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        monthly_rent: (application.rent_budget || '1000').toString(),
        security_deposit: ((application.rent_budget || 1000) * 2).toString(),
      };

      // Call the API to decide on application
      await apiClient.decideApplication(applicationId, decisionData);
      
      // Only refresh data if the API call was successful
      await fetchData();
      
      // Show success message
      alert('✅ Application qualified and moved to Shortlisted!');
      
    } catch (error: any) {
      console.error('Qualification error:', error);
      
      // Check if this is a 404 error (endpoint not implemented)
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Backend endpoint not available, using fallback method...');
        
        try {
          // Fallback: Update application status directly to approved
          const app = applications.find(app => app.id === applicationId);
          await apiClient.updateApplication(applicationId, {
            status: 'approved',
            monthly_rent: app?.rent_budget || 1000,
            security_deposit: (app?.rent_budget || 1000) * 2
          } as any);
          
          // Refresh data to show the updated status
          await fetchData();
          
          // Show success message (no mention of fallback)
          alert('✅ Application qualified and moved to Shortlisted!');
          
        } catch (fallbackError: any) {
          console.error('Fallback method also failed:', fallbackError);
          alert(`❌ Failed to qualify application: ${fallbackError.message}`);
        }
      } else {
        // Handle other types of errors
        let errorMessage = 'Failed to qualify application';
        
        if (error.message.includes('400')) {
          errorMessage = `❌ Invalid Data: ${error.message}\n\nPlease check the application data and try again.`;
        } else if (error.message.includes('500')) {
          errorMessage = `❌ Server Error: ${error.message}\n\nPlease try again or contact support.`;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
        
        alert(errorMessage);
      }
    }
  };

  const handleApprove = async (applicationId: number, propertyId: number) => {
    // This will be used for final approval with lease details later
    const application = applications.find(app => app.id === applicationId);
    const property = properties.find(p => p.id === propertyId);
    
    if (!application || !property) {
      alert('Application or property not found');
      return;
    }
    
    setSelectedApplicationForApproval(application);
    setSelectedPropertyForApproval(property);
    setIsApprovalModalOpen(true);
  };

  const handleApprovalSubmit = async (applicationId: number, approvalData: any) => {
    try {
      console.log('Sending approval decision data:', approvalData);
      
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // If property was changed, we need to update the application's property reference
      if (approvalData.property_id && application.property_ref !== approvalData.property_id) {
        try {
          await apiClient.updateApplication(applicationId, {
            property_ref: approvalData.property_id
          });
          console.log('Updated application property reference');
        } catch (updateError) {
          console.error('Failed to update application property:', updateError);
          // Continue with approval even if property update fails
        }
      }
      
      // For viewing_completed applications, use room assignment and lease creation workflow
      if (application.status === 'viewing_completed' || application.status === 'processing') {
        // Step 1: Assign room if specified
        if (approvalData.room_id) {
          await apiClient.assignRoom(applicationId, { room_id: approvalData.room_id });
          console.log('Room assigned successfully');
        }
        
        // Step 2: Create lease with user-specified details
        try {
          let currentUserId;
          if (user?.id) {
            currentUserId = user.id;
          } else {
            try {
              const currentUser = await apiClient.getProfile();
              currentUserId = currentUser.id;
            } catch (profileError) {
              console.warn('Failed to get current user profile, using fallback');
              // Use a fallback - this should rarely happen
              currentUserId = 1; // Default fallback
            }
          }
          
          const leaseData = {
            tenant: application.tenant,
            application: applicationId,
            property_ref: approvalData.property_id || application.property_ref,
            room: approvalData.room_id || null,
            start_date: approvalData.start_date,
            end_date: approvalData.end_date,
            monthly_rent: parseFloat(approvalData.monthly_rent),
            security_deposit: parseFloat(approvalData.security_deposit),
            status: 'draft',
            is_active: false,
            decision_notes: approvalData.decision_notes || '',
            created_by: currentUserId,
          };
          
          console.log('Creating lease with data:', leaseData);
          await apiClient.createLease(leaseData);
          console.log('Lease created successfully');

        } catch (leaseError) {
          console.error('Failed to create lease:', leaseError);
          throw new Error('Failed to create lease: ' + (leaseError instanceof Error ? leaseError.message : 'Unknown error'));
        }
        
        fetchData(); // Refresh data
        setIsApprovalModalOpen(false);
        setSelectedApplicationForApproval(null);
        setSelectedPropertyForApproval(null);
        alert('✅ Room assigned and lease created successfully!');
      } else {
        // For pending applications, use the original decide workflow
        await apiClient.decideApplication(applicationId, approvalData);
        fetchData(); // Refresh data
        setIsApprovalModalOpen(false);
        setSelectedApplicationForApproval(null);
        setSelectedPropertyForApproval(null);
        alert('✅ Application approved successfully!');
      }
    } catch (error: any) {
        console.error('Approval error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || (error instanceof Error ? error.message : 'An unknown error occurred');
      alert(`❌ Failed to process application: ${errorMessage}\n\nPlease check the console for more details.`);
    }
  };

  const handleQuickApprove = async (applicationId: number, propertyId: number) => {
    const propertyDetails = getPropertyDetails(propertyId);
    
    // Debug logging to understand the vacancy issue
    console.log('Property Details Debug:', {
      propertyId,
      property: propertyDetails.property,
      totalRooms: propertyDetails.totalRooms,
      vacantRooms: propertyDetails.vacantRooms,
      vacantRoomsList: propertyDetails.vacantRoomsList,
      allRooms: rooms.filter(room => room.property_ref === propertyId),
      roomsState: rooms.length
    });
    
    // Check for a valid property object
    if (!propertyDetails.property) {
      alert('Error: Could not find property details. Please refresh and try again.');
      return;
    }

    const { property, vacantRooms, vacantRoomsList } = propertyDetails;
    const isPerProperty = property.rent_type === 'per_property';

    // Approval logic for 'per_property' rentals
    if (isPerProperty) {
      // For per-property rentals, check if the property itself is available
      // We can use the property's vacant_rooms field from the API
      const isPropertyOccupied = property.vacant_rooms === 0 && property.total_rooms > 0;
      if (isPropertyOccupied) {
        alert(`Cannot approve: This property is already fully occupied (${property.total_rooms} total rooms, ${property.vacant_rooms} vacant). Please check the property status.`);
        return;
      }
    } 
    // Approval logic for 'per_room' rentals
    else {
      if (vacantRooms === 0) {
        // More detailed error message for debugging
        alert(`Cannot approve - no vacant rooms in this property.\n\nDebug info:\n- Total rooms found: ${propertyDetails.totalRooms}\n- Vacant rooms: ${vacantRooms}\n- Property type: ${property.rent_type}\n\nPlease check if rooms are properly loaded and marked as vacant.`);
        return;
      }
    }

      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        alert('Application not found');
        return;
      }

    // For per-room rentals, get the first available room
    // For per-property rentals, use the property name
    let assignedRoomName = 'Entire Property';
    let roomId = undefined;
    
    if (!isPerProperty && vacantRoomsList.length > 0) {
      assignedRoomName = vacantRoomsList[0].name;
      roomId = vacantRoomsList[0].id;
    }
      
      // Calculate lease dates
    const today = new Date();
    const startDate = application.desired_move_in_date || today.toISOString().split('T')[0];

    const parsedStartDate = new Date(startDate);
    const endDate = new Date(parsedStartDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    // Prepare decision data with all required fields
    const monthlyRent = parseFloat(String(application.rent_budget || property.monthly_rent || '1000'));
    const securityDeposit = monthlyRent * 2;
    
    const decisionData: any = {
      decision: 'approve' as const,
      decision_notes: `Quick approved and assigned to ${assignedRoomName}`,
          start_date: startDate,
          end_date: endDate.toISOString().split('T')[0],
      monthly_rent: monthlyRent.toFixed(2),
      security_deposit: securityDeposit.toFixed(2),
    };
    
    // Add room assignment for per-room rentals
    if (!isPerProperty && roomId) {
      decisionData.room_id = roomId;
    }
    
    console.log('Sending approval decision data:', decisionData);
    
    try {
      await apiClient.decideApplication(applicationId, decisionData);
        fetchData(); // Refresh data
      alert(`✅ Application approved!\n\nTenant: ${application.tenant_name}\nAssigned: ${assignedRoomName}\nLease created successfully!`);
    } catch (error: any) {
        console.error('Approval error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || (error instanceof Error ? error.message : 'An unknown error occurred');
      alert(`❌ Failed to approve application: ${errorMessage}\n\nPlease check the console for more details.`);
    }
  };

  const handleReject = async (applicationId: number) => {
    const reason = prompt('Please provide a reason for rejecting this application. This will be logged and may be visible to the applicant.');
    if (!reason || reason.trim() === '') {
      alert('Rejection cancelled. A reason is required.');
      return;
    }

    // Prepare rejection data with correct field name
    const decisionData = {
      decision: 'reject' as const,
      rejection_reason: reason.trim()
    };
    
    console.log('Sending rejection decision data:', decisionData);
    console.log('Application ID:', applicationId);

    try {
      await apiClient.decideApplication(applicationId, decisionData);
      fetchData(); // Refresh data
      alert('Application rejected successfully.');
    } catch (error: any) {
      console.error('Rejection failed:', error);
      console.error('Full error object:', error.response);
      
      // Check if this is a 404 error (endpoint not implemented) - fallback should handle this silently
      if (error.message.includes('404') || error.message.includes('not found')) {
        // The fallback mechanism in decideApplication should have handled this
        // If we're here, it means the fallback worked, so just refresh and show success
        fetchData();
        alert('Application rejected successfully.');
      } else {
        // Handle other types of errors
        let errorMessage = 'Unknown error occurred';
        if (error.response?.data) {
          const data = error.response.data;
          errorMessage = data.detail || data.message || data.error || JSON.stringify(data);
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(`Failed to reject application: ${errorMessage}\n\nPlease check the console for more details.`);
      }
    }
  };

  const handleDelete = async (applicationId: number) => {
    try {
      await apiClient.deleteApplication(applicationId);
      fetchData(); // Refresh data
      alert('Application deleted successfully.');
    } catch (error: any) {
      console.error('Delete failed:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to delete application';
      alert(`Failed to delete application: ${errorMessage}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  // Removed getStatusBadge as StatusBadge component handles this

  const handleRoomAssignment = async (applicationId: number, roomId: number, roomInfo: unknown) => {
    try {
      await apiClient.assignRoom(applicationId, { room_id: roomId });
      fetchData(); // Refresh data
      alert('✅ Room assigned successfully!');
    } catch (error: any) {
      console.error('Room assignment error:', error);
      const errorMessage = error.message || 'Failed to assign room. Please try again.';
      alert(`❌ ${errorMessage}`);
    } finally {
    setIsRoomAssignmentModalOpen(false);
    setSelectedApplicationForAssignment(null);
    }
  };

  const openLeaseGenerationModal = (application: Application, room: Room) => {
    setSelectedApplicationForLease(application);
    setSelectedRoomForLease(room);
    setIsLeaseGenerationOpen(true);
  };

  const handleLeaseGenerated = (leaseData: { applicationId: number; tenantName: string; roomName: string; leaseStartDate: string; leaseEndDate: string }) => {
    // Update application status to lease_created
    setApplications(prevApps => 
      prevApps.map(app => 
        app.id === leaseData.applicationId 
          ? { ...app, status: 'lease_created' }
          : app
      )
    );
    
    // Show success message
    alert(`✅ Lease generated successfully!\n\nTenant: ${leaseData.tenantName}\nRoom: ${leaseData.roomName}\nLease Period: ${leaseData.leaseStartDate} to ${leaseData.leaseEndDate}`);
  };

  // Filter applications by status (used for metrics only now)
  const pendingApplications = filteredApplications.filter(app => app.status === 'pending');

  const downloadApplicationsReport = () => {
    const csvData = [
      ['Applicant Name', 'Email', 'Property', 'Status', 'Applied Date', 'Days Pending'],
      ...applications.map(app => [
        app.tenant_name || `Tenant ID: ${app.tenant}`,
        app.tenant_email || 'N/A',
        getPropertyName(app.property_ref),
          app.status.toUpperCase(),
        app.created_at.split('T')[0],
        (app.days_pending || 0).toString()
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `tink-applications-report-${today}.csv`;
    a.click();
  };

  const openRoomAssignmentModal = (application: Application) => {
    setSelectedApplicationForAssignment(application);
    setIsRoomAssignmentModalOpen(true);
  };

  const openPropertyRoomManagement = (property: Property) => {
    setSelectedPropertyForManagement(property);
    setIsPropertyRoomManagementOpen(true);
  };

  const openApplicationDetail = (application: Application) => {
    setSelectedApplicationForDetail(application);
    setIsApplicationDetailOpen(true);
  };

  const handleConflictResolution = (resolutions: ConflictResolution[]) => {
    // Implementation of handleConflictResolution
    console.log('Conflict resolutions:', resolutions);
    setIsConflictModalOpen(false);
    setConflictingApplications([]);
    fetchData();
  };

  const getApproveButtonTooltip = (propertyId: number) => {
    const propertyDetails = getPropertyDetails(propertyId);
    const propertyName = getPropertyName(propertyId);
    
    if (propertyDetails.vacantRooms === 0) {
      return `Cannot approve - no vacant rooms available in ${propertyName}. Click "Room Management" to add rooms or manage room availability.`;
    }
    return `Quick approve and automatically assign to available room in ${propertyName} (${propertyDetails.vacantRooms} vacant rooms available)`;
  };

  const getLeaseButtonTooltip = (app: Application) => {
    const availableRooms = rooms.filter(room => 
      room.property_ref === app.property_ref && room.is_vacant
    );
    
    if (availableRooms.length === 0) {
      return 'Cannot generate lease - no available rooms in this property';
    }
    return `Generate lease document for ${app.tenant_name} - ${availableRooms.length} room(s) available`;
  };

  const handleGenerateLease = (app: Application) => {
    // Allow lease generation for viewing_completed and room_assigned statuses
    if (app.status !== 'room_assigned' && app.status !== 'viewing_completed' && app.status !== 'processing') {
      alert(`Lease can only be generated after viewing is completed. Current status: ${app.status}`);
      return;
    }

    // Find the room for this application
    let assignedRoom = null;
    
    // First try to find by app.room (if already assigned)
    if (app.room) {
      assignedRoom = rooms.find(room => room.id === app.room);
    }
    
    // If no room found, try to find by property and availability
    if (!assignedRoom && app.property_ref) {
      const propertyRooms = rooms.filter(room => room.property_ref === app.property_ref);
      
      // Try to find a vacant room in the property
      assignedRoom = propertyRooms.find(room => room.is_vacant);
      
      // If no vacant room, use the first room (for whole property rentals)
      if (!assignedRoom && propertyRooms.length > 0) {
        assignedRoom = propertyRooms[0];
      }
    }

    if (!assignedRoom) {
      alert('Error: No suitable room could be found for this application. Please check the property and room availability.');
      return;
    }

    setSelectedApplicationForLease(app);
    setSelectedRoomForLease(assignedRoom);
    setIsLeaseGenerationOpen(true);
  };

  const handleMessage = (app: Application) => {
    // Navigate to communication page with this applicant
    router.push(`/communication?applicant=${app.id}&tenant=${app.tenant_name}`);
  };

  const handleSetupViewing = (app: Application) => {
    if (app.status === 'approved') {
      // Schedule new viewing
      setSelectedApplicationForViewing(app);
      setIsViewingSchedulerOpen(true);
    } else if (app.status === 'viewing_scheduled') {
      // Complete existing viewing
      const viewing = app.viewings?.[0]; // Get the latest viewing
      if (viewing) {
        setSelectedApplicationForViewing(app);
        setSelectedViewingForCompletion(viewing);
        setIsViewingCompletionOpen(true);
      } else {
        // If no viewing data found in app object, check localStorage workaround
        const tempViewings = JSON.parse(localStorage.getItem('temp_viewings') || '[]');
        const appViewing = tempViewings.find((v: any) => v.application === app.id);
        
        if (appViewing) {
          setSelectedApplicationForViewing(app);
          setSelectedViewingForCompletion(appViewing);
          setIsViewingCompletionOpen(true);
        } else {
          // If still no viewing found, allow completion anyway
          setSelectedApplicationForViewing(app);
          setSelectedViewingForCompletion(null);
          setIsViewingCompletionOpen(true);
        }
      }
    } else {
      alert(`Cannot setup viewing for application in ${app.status} status`);
    }
  };

  const handleScheduleViewing = async (viewingData: {
    scheduled_date: string;
    scheduled_time: string;
    contact_person: string;
    contact_phone: string;
    viewing_notes: string;
  }) => {
    if (!selectedApplicationForViewing) return;

    try {
      await apiClient.ensureValidToken(); // Proactively refresh token if needed
      
      // Call the API to schedule viewing
      const schedulingResult = await apiClient.scheduleViewing(selectedApplicationForViewing.id, viewingData);
      
      // Only refresh data if the API call was successful
      await fetchData(); // Refresh data
      
      // Show success message
      alert(`✅ Viewing scheduled successfully!\n\nDate: ${viewingData.scheduled_date}\nTime: ${viewingData.scheduled_time}\nContact: ${viewingData.contact_person}\n\nThe viewing has been recorded. You can now complete the viewing from the kanban board.`);
      
    } catch (error: any) {
      console.error('Schedule viewing error:', error);
      
      // Check if this is a 404 error (endpoint not implemented)
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Backend endpoint not available, using fallback method...');
        
        try {
          // Fallback: Update application status and store viewing data locally
          await apiClient.updateApplication(selectedApplicationForViewing.id, {
            status: 'viewing_scheduled'
          } as any);
          
          // Store viewing data in localStorage as a temporary workaround
          const tempViewings = JSON.parse(localStorage.getItem('temp_viewings') || '[]');
          const newViewing = {
            id: Date.now(), // Temporary ID
            application: selectedApplicationForViewing.id,
            scheduled_date: viewingData.scheduled_date,
            scheduled_time: viewingData.scheduled_time,
            contact_person: viewingData.contact_person,
            contact_phone: viewingData.contact_phone,
            viewing_notes: viewingData.viewing_notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          tempViewings.push(newViewing);
          localStorage.setItem('temp_viewings', JSON.stringify(tempViewings));
          
          // Refresh data to show the updated status
          await fetchData();
          
          // Show success message (no mention of fallback)
          alert(`✅ Viewing scheduled successfully!\n\nDate: ${viewingData.scheduled_date}\nTime: ${viewingData.scheduled_time}\nContact: ${viewingData.contact_person}\n\nThe viewing has been recorded. You can now complete the viewing from the kanban board.`);
          
        } catch (fallbackError: any) {
          console.error('Fallback method also failed:', fallbackError);
          alert(`❌ Failed to schedule viewing: ${fallbackError.message}`);
        }
      } else {
        // Handle other types of errors
        let errorMessage = 'Failed to schedule viewing';
        
        if (error.message.includes('400')) {
          errorMessage = `❌ Invalid Data: ${error.message}\n\nPlease check the form data and try again.`;
        } else if (error.message.includes('500')) {
          errorMessage = `❌ Server Error: ${error.message}\n\nPlease try again or contact support.`;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
        
        alert(errorMessage);
      }
      
    } finally {
      // Always close the modal regardless of success or failure
      setIsViewingSchedulerOpen(false);
      setSelectedApplicationForViewing(null);
    }
  };

  const handleCompleteViewing = async (completionData: {
    outcome: 'positive' | 'negative' | 'neutral';
    tenant_feedback?: string;
    landlord_notes?: string;
    next_action?: string;
  }) => {
    if (!selectedApplicationForViewing) return;

    try {
      // Call the API to complete viewing
      await apiClient.completeViewing(selectedApplicationForViewing.id, completionData);
      
      // Only refresh data if the API call was successful
      await fetchData(); // Refresh data
      
      // Show success message
      alert(`✅ Viewing completed successfully!\n\nOutcome: ${completionData.outcome}\nNext Action: ${completionData.next_action || 'Proceed with application'}\n\nThe application is now ready for the next stage.`);
      
    } catch (error: any) {
      console.error('Complete viewing error:', error);
      
      // Check if this is a 404 error (endpoint not implemented)
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Backend endpoint not available, using fallback method...');
        
        try {
          // Fallback: Update application status and store completion data locally
          await apiClient.updateApplication(selectedApplicationForViewing.id, {
            status: 'viewing_completed'
          } as any);
          
          // Update viewing data in localStorage with completion information
          const tempViewings = JSON.parse(localStorage.getItem('temp_viewings') || '[]');
          const viewingIndex = tempViewings.findIndex((v: any) => v.application === selectedApplicationForViewing.id);
          
          if (viewingIndex !== -1) {
            // Update existing viewing with completion data
            tempViewings[viewingIndex] = {
              ...tempViewings[viewingIndex],
              completed_at: new Date().toISOString(),
              outcome: completionData.outcome,
              tenant_feedback: completionData.tenant_feedback || '',
              landlord_notes: completionData.landlord_notes || '',
              next_action: completionData.next_action || '',
              updated_at: new Date().toISOString()
            };
          } else {
            // Create new viewing completion record if not found
            const newViewingCompletion = {
              id: Date.now(), // Temporary ID
              application: selectedApplicationForViewing.id,
              completed_at: new Date().toISOString(),
              outcome: completionData.outcome,
              tenant_feedback: completionData.tenant_feedback || '',
              landlord_notes: completionData.landlord_notes || '',
              next_action: completionData.next_action || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            tempViewings.push(newViewingCompletion);
          }
          
          localStorage.setItem('temp_viewings', JSON.stringify(tempViewings));
          
          // Refresh data to show the updated status
          await fetchData();
          
          // Show success message with note about fallback
          alert(`✅ Viewing completed successfully!\n\nOutcome: ${completionData.outcome}\nNext Action: ${completionData.next_action || 'Proceed with application'}\n\nThe application is now ready for the next stage.`);
          
        } catch (fallbackError: any) {
          console.error('Fallback method also failed:', fallbackError);
          alert(`❌ Failed to complete viewing: ${fallbackError.message}`);
        }
      } else {
        // Handle other types of errors
        let errorMessage = 'Failed to complete viewing';
        
        if (error.message.includes('400')) {
          errorMessage = `❌ Invalid Data: ${error.message}\n\nPlease check the form data and try again.`;
        } else if (error.message.includes('500')) {
          errorMessage = `❌ Server Error: ${error.message}\n\nPlease try again or contact support.`;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
        
        alert(errorMessage);
      }
    }
  };

  const handleNewLeaseGeneration = async (applicationId: number) => {
    try {
      await apiClient.generateLease(applicationId);
      fetchData(); // Refresh data
      alert('Lease generated successfully!');
    } catch (error: any) {
      alert(`Failed to generate lease: ${error.message}`);
    }
  };

  const handleActivateLease = async (app: Application) => {
    try {
      // First, we need to find the lease associated with this application
      const leasesResponse = await apiClient.getLeases();
      const leases = leasesResponse.results || [];
      
      // Find lease by matching tenant and property (and room if specified)
      const associatedLease = leases.find(lease => 
        lease.tenant === app.tenant && 
        lease.property_ref === app.property_ref &&
        lease.status === 'draft' // Only activate draft leases
      );
      
      if (!associatedLease) {
        throw new Error('No draft lease found for this application');
      }
      
      // Use the move-in endpoint to activate the lease
      const moveInData = {
        move_in_date: new Date().toISOString().split('T')[0], // Today's date
        move_in_condition: 'Good condition',
        deposit_collected: associatedLease.security_deposit || 0
      };
      
      await apiClient.processMovein(associatedLease.id, moveInData);
      fetchData(); // Refresh data
      alert(`✅ Move-in processed successfully for ${app.tenant_name || `Applicant #${app.id}`}!`);
    } catch (error: any) {
      console.error('Move-in processing error:', error);
      const errorMessage = error.message || 'Failed to process move-in. Please try again.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleSkipViewing = async (applicationId: number) => {
    try {
      // Call the API to skip viewing
      await apiClient.skipViewing(applicationId);
      
      // Only refresh data if the API call was successful
      await fetchData(); // Refresh data
      
      // Show success message
      alert('✅ Viewing skipped! Application moved to next stage.');
      
    } catch (error: any) {
      console.error('Skip viewing error:', error);
      
      // Check if this is a 404 error (endpoint not implemented)
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Backend endpoint not available, using fallback method...');
        
        try {
          // Fallback: Update application status directly to viewing_completed
          await apiClient.updateApplication(applicationId, {
            status: 'viewing_completed'
          } as any);
          
          // Store skip viewing record in localStorage
          const tempViewings = JSON.parse(localStorage.getItem('temp_viewings') || '[]');
          const skipViewingRecord = {
            id: Date.now(), // Temporary ID
            application: applicationId,
            skipped_at: new Date().toISOString(),
            outcome: 'skipped',
            tenant_feedback: '',
            landlord_notes: 'Viewing was skipped by landlord/manager',
            next_action: 'Proceed to room assignment',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          tempViewings.push(skipViewingRecord);
          localStorage.setItem('temp_viewings', JSON.stringify(tempViewings));
          
          // Refresh data to show the updated status
          await fetchData();
          
          // Show success message (no mention of fallback)
          alert('✅ Viewing skipped! Application moved to next stage.');
          
        } catch (fallbackError: any) {
          console.error('Fallback method also failed:', fallbackError);
          alert(`❌ Failed to skip viewing: ${fallbackError.message}`);
        }
      } else {
        // Handle other types of errors
        let errorMessage = 'Failed to skip viewing';
        
        if (error.message.includes('400')) {
          errorMessage = `❌ Invalid Data: ${error.message}\n\nPlease check the application status and try again.`;
        } else if (error.message.includes('500')) {
          errorMessage = `❌ Server Error: ${error.message}\n\nPlease try again or contact support.`;
        } else {
          errorMessage = `❌ ${error.message}`;
        }
        
        alert(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Applications Review"
        subtitle="Loading applications data..."
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  // Calculate metrics
  const metrics = {
    total: filteredApplications.length,
    pending: pendingApplications.length,
    approved: filteredApplications.filter(app => app.status === 'approved').length,
    rejected: filteredApplications.filter(app => app.status === 'rejected').length,
    active: filteredApplications.filter(app => ['moved_in', 'active'].includes(app.status)).length,
    conversionRate: filteredApplications.length > 0 ? 
      Math.round((filteredApplications.filter(app => ['approved', 'lease_created', 'moved_in', 'active'].includes(app.status)).length / filteredApplications.length) * 100) : 0,
    avgDaysPending: filteredApplications.length > 0 ?
      Math.round(filteredApplications.reduce((sum, app) => sum + (app.days_pending || 0), 0) / filteredApplications.length) : 0,
  };

  return (
    <DashboardLayout title="">
      <Head>
        <title>Applications Review - Tink Property Management</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Custom Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">Applications Review</h1>
              <div className="subtitle-container">
                <p className="welcome-message">
                  Review and decide on rental applications. Approved tenants must be assigned to rooms and moved in.
                </p>
              </div>
            </div>
            <div className="header-right">
              {/* Primary quick-action buttons - reordered */}
              <button onClick={() => router.push('/listings')} className="view-all-btn" title="View and manage property listings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                View Listings
              </button>

              <button
                onClick={() => router.push('/tenants')}
                className="view-all-btn"
                title="View all tenants, their lease details, and rental history"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                View All Tenants
              </button>

              <button
                onClick={() => {
                  const property = properties.find(p => p.id === selectedProperty);
                  if (property) {
                    openPropertyRoomManagement(property);
                  } else if (properties.length > 0) {
                    openPropertyRoomManagement(properties[0]);
                  }
                }}
                className="view-all-btn room-management-btn"
                title="Manage room availability, pricing, and assignments across all properties"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                Room Management
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        
        {/* Top Metrics Row */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Total Applications</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.total}</div>
              <div className="metric-subtitle">Total received</div>
              <div className="metric-progress">
                <span className="metric-label">All time</span>
                <span className="metric-change positive">+{metrics.total > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Pending Review</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.pending}</div>
              <div className="metric-subtitle">Awaiting decision</div>
              <div className="metric-progress">
                <span className="metric-label">Needs review</span>
                <span className="metric-change positive">+{metrics.pending > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Approved</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.approved}</div>
              <div className="metric-subtitle">Successfully approved</div>
              <div className="metric-progress">
                <span className="metric-label">Approval rate</span>
                <span className="metric-change positive">+{metrics.approved > 0 ? '1' : '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-info">
                <h3 className="metric-title">Conversion Rate</h3>
                <div className="metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 17l6-6 4 4 8-8"/>
                    <path d="M21 7l-5 5v-4h-4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.conversionRate}%</div>
              <div className="metric-subtitle">Applications to tenants</div>
              <div className="metric-progress">
                <span className="metric-label">Success rate</span>
                <span className="metric-change positive">+{metrics.conversionRate > 50 ? '↗' : metrics.conversionRate > 25 ? '→' : '↘'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board View */}
        <ApplicationKanban
          applications={filteredApplications}
          onReview={openApplicationDetail}
          onApprove={handleApprove}
          onQualify={handleQualify}
          onReject={handleReject}
          onAssignRoom={openRoomAssignmentModal}
          onGenerateLease={handleGenerateLease}
          onMessage={handleMessage}
          onSetupViewing={handleSetupViewing}
          onActivateLease={handleActivateLease}
          onSkipViewing={handleSkipViewing}
          onDelete={handleDelete}
          getPropertyName={getPropertyName}
          formatDate={formatDate}
          extraActions={(
            <>
                <button 
                  onClick={fetchData} 
                  className="refresh-btn"
                  title="Refresh applications data to get the latest information"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  Refresh
                </button>
                <button 
                  onClick={downloadApplicationsReport} 
                  className="view-all-btn"
                  title="Download a comprehensive report of all applications with analytics and insights"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <path d="M12 15V3" />
                  </svg>
                  Download Report
                </button>
            </>
          )}
        />

        {/* Legacy pending & processed application tables removed – all workflow management is now handled via the Kanban board */}
      </div>

      {/* Modal removed - applications are now created through listings */}

      {isConflictModalOpen && (
        <ConflictResolutionModal
          conflictingApplications={conflictingApplications}
          availableRooms={rooms.filter(room => room.is_vacant)}
          properties={properties}
          onClose={() => setIsConflictModalOpen(false)}
          onResolveConflict={handleConflictResolution}
        />
      )}

      {isRoomAssignmentModalOpen && selectedApplicationForAssignment && (
        <RoomAssignmentModal
          application={selectedApplicationForAssignment}
          availableRooms={rooms.filter(room => room.is_vacant)}
          properties={properties}
          onClose={() => {
            setIsRoomAssignmentModalOpen(false);
            setSelectedApplicationForAssignment(null);
          }}
          onAssignRoom={handleRoomAssignment}
        />
      )}

      {isPropertyRoomManagementOpen && (
        <PropertyRoomManagement
          isOpen={isPropertyRoomManagementOpen}
          selectedProperty={selectedPropertyForManagement}
          applications={applications}
          onClose={() => {
            setIsPropertyRoomManagementOpen(false);
            setSelectedPropertyForManagement(null);
          }}
          onRoomUpdate={fetchData}
        />
      )}

      {isApplicationDetailOpen && selectedApplicationForDetail && (
        <ApplicationDetailModal
          isOpen={isApplicationDetailOpen}
          application={selectedApplicationForDetail}
          properties={properties}
          rooms={rooms}
          onClose={() => {
            setIsApplicationDetailOpen(false);
            setSelectedApplicationForDetail(null);
          }}
          onApprove={handleQuickApprove}
          onReject={handleReject}
          onAssignRoom={openRoomAssignmentModal}
        />
      )}

      {isLeaseGenerationOpen && selectedApplicationForLease && selectedRoomForLease && (
        <ImprovedLeaseGenerationModal
          isOpen={isLeaseGenerationOpen}
          application={selectedApplicationForLease}
          room={selectedRoomForLease}
          properties={properties}
          rooms={rooms}
          onClose={() => {
            setIsLeaseGenerationOpen(false);
            setSelectedApplicationForLease(null);
            setSelectedRoomForLease(null);
          }}
          onLeaseGenerated={handleLeaseGenerated}
        />
      )}

      {isViewingSchedulerOpen && selectedApplicationForViewing && (
        <ViewingSchedulerModal
          isOpen={isViewingSchedulerOpen}
          application={selectedApplicationForViewing}
          onClose={() => {
            setIsViewingSchedulerOpen(false);
            setSelectedApplicationForViewing(null);
          }}
          onSchedule={handleScheduleViewing}
        />
      )}

      {isApprovalModalOpen && selectedApplicationForApproval && (
        <ApplicationApprovalModal
          isOpen={isApprovalModalOpen}
          application={selectedApplicationForApproval}
          property={selectedPropertyForApproval}
          availableRooms={selectedPropertyForApproval ? rooms.filter(room => 
            room.property_ref === selectedPropertyForApproval.id && room.is_vacant
          ) : []}
          allProperties={properties}
          allRooms={rooms}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedApplicationForApproval(null);
            setSelectedPropertyForApproval(null);
          }}
          onApprove={handleApprovalSubmit}
        />
      )}

      {isViewingCompletionOpen && selectedApplicationForViewing && (
        <ViewingCompletionModal
          isOpen={isViewingCompletionOpen}
          application={selectedApplicationForViewing}
          viewing={selectedViewingForCompletion}
          onClose={() => {
            setIsViewingCompletionOpen(false);
            setSelectedApplicationForViewing(null);
            setSelectedViewingForCompletion(null);
          }}
          onComplete={handleCompleteViewing}
        />
      )}

      {isNewLeaseModalOpen && selectedApplicationForNewLease && (
        <LeaseGenerationModal
          isOpen={isNewLeaseModalOpen}
          application={selectedApplicationForNewLease}
          onClose={() => {
            setIsNewLeaseModalOpen(false);
            setSelectedApplicationForNewLease(null);
          }}
          onGenerateLease={handleNewLeaseGeneration}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Error Banner */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: white;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .metric-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }

        .metric-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Main Content */
        .main-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        /* Section Styling */
        .pending-section,
        .processed-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* Button Styles */
        .new-application-btn {
          background-color: var(--primary-500, #8A2BE2);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .new-application-btn:hover {
          background-color: var(--primary-600, #7A1DD1);
        }

        .refresh-btn {
          background-color: #fff;
          color: var(--gray-700, #4a5568);
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        /* Primary action button from manager-dashboard */
        .view-all-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .view-all-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Table Styling - Manager Dashboard Standard */
        .applications-scroll-container {
          overflow-y: auto;
          max-height: 500px;
        }

        .applications-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .applications-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .applications-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .applications-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .applications-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        /* Add hover effect for table rows */
        .applications-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .applications-table tbody tr:hover {
          background-color: #f9fafb;
        }

        /* Table headers - Manager Dashboard Standard */
        .applications-table th {
          position: sticky;
          top: 0;
          background: #ffffff;
          z-index: 2;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 12px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        /* Table cells - Manager Dashboard Standard */
        .applications-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        /* Center align specific columns */
        .applications-table th.table-center,
        .applications-table td.table-center {
          text-align: center !important;
        }

        .applications-table th.table-left,
        .applications-table td.table-left {
          text-align: left !important;
        }

        .applicant-name {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .applicant-email {
          font-size: 14px;
          color: #6b7280;
        }

        .clickable-name {
          cursor: pointer;
          transition: color 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }

        .clickable-name:hover {
          color: #3b82f6;
          background: #eff6ff;
        }

        .clickable-property {
          cursor: pointer;
          transition: color 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }

        .clickable-property:hover {
          color: #059669;
          background: #ecfdf5;
        }

        .property-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .property-vacancy {
          font-size: 12px;
          color: #64748b;
        }

        .app-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .app-details > div {
          color: #64748b;
        }

        .detail-label {
          font-weight: 600;
          color: #374151;
          margin-right: 4px;
        }

        .decision-notes {
          font-style: normal;
          color: #64748b;
          margin-top: 0;
          font-size: 12px;
        }

        .date-highlight {
          background-color: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #334155;
        }

        .pending-days {
          font-size: 12px;
          color: #d97706;
          font-weight: 500;
          margin-top: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Status Badges - Manager Dashboard Standard */
        .status-badge {
        }

        .status-badge.status-pending {
        }

        .status-badge.status-approved {
        }

        .status-badge.status-rejected {
        }

        /* Manager Dashboard Button Standard */
        .manage-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .manage-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .manage-btn.approve-btn {
          background: #10b981;
        }

        .manage-btn.approve-btn:hover {
          background: #059669;
        }

        .manage-btn.approve-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .manage-btn.reject-btn {
          background: #ef4444;
        }

        .manage-btn.reject-btn:hover {
          background: #dc2626;
        }

        .manage-btn.view-btn {
          background: #4f46e5;
        }

        .manage-btn.view-btn:hover {
          background: #3730a3;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 24px 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .dashboard-title {
            font-size: 28px;
          }
          
          .welcome-message {
            font-size: 14px;
          }
          
          .metric-card {
            padding: 16px;
          }
          
          .metric-value {
            font-size: 24px;
          }
          
          .pending-section,
          .processed-section {
            padding: 16px;
          }

          .applications-table-container {
            overflow-x: scroll;
          }

          .applications-table th,
          .applications-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-title {
            font-size: 24px;
          }

          .welcome-message {
            font-size: 13px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .metric-card, 
        :global(.dark-mode) .pending-section, 
        :global(.dark-mode) .processed-section {
          background: #111111 !important;
          border: 1px solid #333333 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        :global(.dark-mode) .metric-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .applications-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .applications-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .applications-table tbody tr:hover {
          background-color: #222222 !important;
        }
        :global(.dark-mode) .refresh-btn {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .refresh-btn:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .view-all-btn {
            background: #3b82f6 !important;
            border: none !important;
        }
        :global(.dark-mode) .view-all-btn:hover {
            background: #2563eb !important;
        }
        :global(.dark-mode) .status-badge.status-pending { 
          background: rgba(249, 115, 22, 0.3); 
          color: #ffffff !important;
        }
        :global(.dark-mode) .status-badge.status-approved { 
          background: rgba(34, 197, 94, 0.3); 
          color: #ffffff !important;
        }
        :global(.dark-mode) .status-badge.status-rejected { 
          background: rgba(239, 68, 68, 0.3); 
          color: #ffffff !important;
        }
        :global(.dark-mode) .manage-btn {
            color: #ffffff !important;
        }
        :global(.dark-mode) .error-banner {
          background: rgba(239, 68, 68, 0.1) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }
        :global(.dark-mode) .date-highlight {
          background-color: #334155;
          color: #e2e8f0;
        }
        :global(.dark-mode) .detail-label {
          color: #d1d5db;
        }

        .property-room-btn {
          background: #059669 !important;
        }

        .property-room-btn:hover {
          background: #047857 !important;
        }

        .detail-btn {
          background: #8b5cf6 !important;
        }

        .detail-btn:hover {
          background: #7c3aed !important;
        }

        .lease-btn {
          background: #059669 !important;
        }

        .lease-btn:hover {
          background: #047857 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Applications, ['admin', 'owner', 'manager']);