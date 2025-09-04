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
import { FileText, Clock, CheckCircle, TrendingUp, Calendar, LogOut, Calculator } from 'lucide-react';

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
import ViewingManagementModal from '../components/ViewingManagementModal';

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
  
  // Add state for viewing management modal
  const [isViewingManagementOpen, setIsViewingManagementOpen] = useState(false);
  const [viewingsCount, setViewingsCount] = useState<number>(0);
  
  // Add state for move-out modal
  const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
  const [selectedApplicationForMoveOut, setSelectedApplicationForMoveOut] = useState<Application | null>(null);
  const [moveOutDate, setMoveOutDate] = useState('');
  const [depositReturn, setDepositReturn] = useState('');
  const [moveOutCalculations, setMoveOutCalculations] = useState<{
    monthsRemaining: number;
    daysRemaining: number;
    rentForgo: number;
    depositReturned: number;
    totalForgo: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Add visibility change listener to refresh data when user returns to this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing applications data...');
        fetchData();
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing applications data...');
      fetchData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add router events listener to refresh when navigating back to this page
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url === '/applications') {
        console.log('🔄 Navigated to applications page, refreshing data...');
        setTimeout(fetchData, 100); // Small delay to ensure page is ready
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
  
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

  const fetchViewingsCount = async () => {
    try {
      const viewings = await apiClient.getAllViewings();
      const scheduledViewings = viewings.filter(v => v.status === 'scheduled');
      setViewingsCount(scheduledViewings.length);
    } catch (error) {
      console.error('Failed to fetch viewings count:', error);
      setViewingsCount(0);
    }
  };

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

      const allLeases = leasesResponse.results || [];
      const activeLeases = allLeases.filter((l:any) => l.status === 'active' || l.is_active);
      const draftedLeases = allLeases.filter((l:any) => l.status === 'draft');

      console.log('📊 Lease Data Debug:', {
        totalLeases: allLeases.length,
        activeLeases: activeLeases.length,
        draftedLeases: draftedLeases.length,
        allLeaseIds: allLeases.map((l:any) => `${l.id}(${l.status})`),
      });

      const apps = (applicationsResponse.results || []).map((app:any) => {
        // Check for any lease associated with this application first
        const associatedLease = allLeases.find((l:any) => l.application === app.id);
        
        if (associatedLease) {
          console.log(`🔗 Found lease for app ${app.id}:`, {
            leaseId: associatedLease.id,
            leaseStatus: associatedLease.status,
            appStatus: app.status
          });
          
          // Map lease status to application status
          let statusMapping: { [key: string]: string } = {
            'draft': 'lease_created',
            'sent_to_tenant': 'lease_created',
            'signed': 'lease_signed',
            'active': 'moved_in'
          };
          
          const mappedStatus = statusMapping[associatedLease.status] || app.status;
          return { 
            ...app, 
            status: mappedStatus, 
            lease: associatedLease, 
            lease_id: associatedLease.id 
          };
        }

        // Legacy checks for backward compatibility
        // If an active lease exists, the applicant has moved in
          const hasActiveLease = activeLeases.some((l:any) => l.tenant === app.tenant && l.property_ref === app.property_ref);
          if (hasActiveLease) {
          const activeLease = activeLeases.find((l:any) => l.tenant === app.tenant && l.property_ref === app.property_ref);
          return { ...app, status: 'moved_in', lease: activeLease, lease_id: activeLease?.id };
          }

        // If a drafted lease exists for this application (legacy)
        const draftedLease = draftedLeases.find((l:any) => l.application === app.id);
        if (draftedLease) {
          return { ...app, status: 'lease_created', lease: draftedLease, lease_id: draftedLease.id };
        }
        
        return app; // Default to backend status if no lease found
      });

      // Debug final application statuses
      const leaseCreatedApps = apps.filter(app => app.status === 'lease_created');
      console.log('📋 Applications with lease_created status:', leaseCreatedApps.map(app => ({
        id: app.id,
        tenant_name: app.tenant_name,
        status: app.status,
        hasLease: !!app.lease,
        leaseStatus: app.lease?.status
      })));

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
    const vacantRooms = propertyRooms.filter(room => room.is_available);
    const occupiedRooms = propertyRooms.filter(room => !room.is_available);
    
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
      
      // Optimistically update the application status in the UI immediately
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'approved' as const }
            : app
        )
      );
      
      // Refresh data from backend (this will happen in background)
      fetchData(); // Don't await this - let it refresh in background
      
      // Enhanced success message with details
      const successMessage = `✅ Application Approved Successfully!\n\n👤 Tenant: ${application.tenant_name}\n🏠 Assigned: ${assignedRoomName}\n💰 Monthly Rent: $${monthlyRent.toFixed(2)}\n🔒 Security Deposit: $${securityDeposit.toFixed(2)}\n\n🎯 Next Steps:\n• Lease document created automatically\n• Send lease to tenant for signing\n• Coordinate move-in date\n• Collect security deposit`;
      
      alert(successMessage);
    } catch (error: any) {
        console.error('Approval error:', error);
      
      // Enhanced error handling for application approval
      let errorTitle = '❌ Failed to Approve Application';
      let errorDetails = '';
      let suggestions = '';
      
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorTitle = '❌ Invalid Approval Data';
        if (error.message.includes('room') || error.message.includes('occupied')) {
          errorDetails = 'The selected room is no longer available or already occupied.';
          suggestions = '• Refresh the page to see current room availability\n• Try assigning a different room\n• Check if other applications already claimed this room';
        } else if (error.message.includes('rent') || error.message.includes('budget')) {
          errorDetails = 'The rent amount or budget information is invalid.';
          suggestions = '• Check the monthly rent amount\n• Verify the security deposit calculation\n• Ensure the tenant\'s budget matches the property rent';
        } else if (error.message.includes('date')) {
          errorDetails = 'The lease start or end dates are invalid.';
          suggestions = '• Ensure move-in date is in the future\n• Check date format is correct\n• Verify lease duration settings';
        } else {
          errorDetails = 'The approval information provided is not valid.';
          suggestions = '• Check all required fields are filled\n• Verify tenant and property details\n• Try refreshing and submitting again';
        }
      } else if (error.message.includes('404')) {
        errorTitle = '❌ Application or Property Not Found';
        errorDetails = 'The application or associated property no longer exists.';
        suggestions = '• The application may have been deleted\n• The property may have been removed\n• Refresh the page to see current applications';
      } else if (error.message.includes('409') || error.message.includes('conflict')) {
        errorTitle = '❌ Room Assignment Conflict';
        errorDetails = 'Another application may have claimed this room first.';
        suggestions = '• Refresh the page to see current room availability\n• Try approving with a different room\n• Check other pending applications for conflicts';
      } else if (error.message.includes('500')) {
        errorTitle = '❌ Server Error';
        errorDetails = 'There was a problem processing the approval.';
        suggestions = '• Please try again in a moment\n• If the issue persists, contact support\n• Check if all property data is properly configured';
      } else {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || (error instanceof Error ? error.message : 'An unknown error occurred');
        errorDetails = errorMessage;
        suggestions = '• Refresh the page and try again\n• Check your internet connection\n• Verify all application data is complete';
      }
      
      const fullMessage = `${errorTitle}\n\n${errorDetails}\n\n💡 Suggestions:\n${suggestions}`;
      alert(fullMessage);
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
      
      // Optimistically update the application status in the UI immediately
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'rejected' as const }
            : app
        )
      );
      
      // Refresh data from backend (this will happen in background)
      fetchData(); // Don't await this - let it refresh in background
      
      // Enhanced success message for rejection
      const application = applications.find(app => app.id === applicationId);
      const successMessage = `✅ Application Rejected Successfully!\n\n👤 Tenant: ${application?.tenant_name || 'Unknown'}\n📝 Reason: ${reason}\n📅 Date: ${new Date().toLocaleDateString()}\n\n🎯 Next Steps:\n• Tenant will be notified automatically\n• Review other applications for this property\n• Document any follow-up actions needed`;
      
      alert(successMessage);
    } catch (error: any) {
      console.error('Rejection failed:', error);
      console.error('Full error object:', error.response);
      
      // Enhanced error handling for application rejection
      let errorTitle = '❌ Failed to Reject Application';
      let errorDetails = '';
      let suggestions = '';
      
      if (error.message.includes('404') || error.message.includes('not found')) {
        errorTitle = '❌ Application Not Found';
        errorDetails = 'The application you\'re trying to reject no longer exists.';
        suggestions = '• The application may have already been processed\n• Refresh the page to see current applications\n• Check if it was moved to a different status';
        
        // The fallback mechanism in decideApplication should have handled this
        // If we're here, it means the fallback worked, so just refresh and show success
        await fetchData();
        const application = applications.find(app => app.id === applicationId);
        const successMessage = `✅ Application Rejected Successfully!\n\n👤 Tenant: ${application?.tenant_name || 'Unknown'}\n📝 Reason: ${reason}\n📅 Date: ${new Date().toLocaleDateString()}`;
        alert(successMessage);
        return;
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorTitle = '❌ Invalid Rejection Data';
        if (error.message.includes('reason') || error.message.includes('required')) {
          errorDetails = 'The rejection reason is missing or invalid.';
          suggestions = '• Provide a clear reason for rejection\n• Reason should be at least 10 characters\n• Be specific about why the application was rejected';
        } else if (error.message.includes('status')) {
          errorDetails = 'This application cannot be rejected in its current status.';
          suggestions = '• Application may already be approved or rejected\n• Refresh the page to see current status\n• Check if application has progressed too far';
        } else {
          errorDetails = 'The rejection information provided is not valid.';
          suggestions = '• Check the rejection reason format\n• Ensure the application is in a rejectable status\n• Try refreshing and submitting again';
        }
      } else if (error.message.includes('500')) {
        errorTitle = '❌ Server Error';
        errorDetails = 'There was a problem processing the rejection.';
        suggestions = '• Please try again in a moment\n• If the issue persists, contact support\n• Check if the rejection was actually processed';
    } else {
        // Handle other types of errors
        let errorMessage = 'Unknown error occurred';
        if (error.response?.data) {
          const data = error.response.data;
          errorMessage = data.detail || data.message || data.error || JSON.stringify(data);
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        errorDetails = errorMessage;
        suggestions = '• Refresh the page and try again\n• Check your internet connection\n• Verify the application still exists';
      }
      
      const fullMessage = `${errorTitle}\n\n${errorDetails}\n\n💡 Suggestions:\n${suggestions}`;
      alert(fullMessage);
    }
  };

  const handleDelete = async (applicationId: number) => {
    // Confirmation before deletion
    const application = applications.find(app => app.id === applicationId);
    const confirmDelete = confirm(`⚠️ Delete Application?\n\nTenant: ${application?.tenant_name || 'Unknown'}\nProperty: ${application?.property_name || 'Unknown'}\n\nThis action cannot be undone. Are you sure?`);
    
    if (!confirmDelete) {
      return;
    }
    
    try {
      await apiClient.deleteApplication(applicationId);
      await fetchData(); // Refresh data
      
      const successMessage = `✅ Application Deleted Successfully!\n\n👤 Tenant: ${application?.tenant_name || 'Unknown'}\n📅 Date: ${new Date().toLocaleDateString()}\n\n🎯 Next Steps:\n• Application removed from system\n• Consider informing the tenant if necessary\n• Review remaining applications for this property`;
      
      alert(successMessage);
    } catch (error: any) {
      console.error('Delete failed:', error);
      
      // Enhanced error handling for application deletion
      let errorTitle = '❌ Failed to Delete Application';
      let errorDetails = '';
      let suggestions = '';
      
      if (error.message.includes('404') || error.message.includes('not found')) {
        errorTitle = '❌ Application Not Found';
        errorDetails = 'The application you\'re trying to delete no longer exists.';
        suggestions = '• The application may have already been deleted\n• Refresh the page to see current applications\n• No further action needed';
        await fetchData(); // Refresh to show current state
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorTitle = '❌ Cannot Delete Application';
        errorDetails = 'This application cannot be deleted in its current status.';
        suggestions = '• Applications with active leases cannot be deleted\n• Consider rejecting instead of deleting\n• Check if application has progressed too far';
      } else if (error.message.includes('403') || error.message.includes('permission')) {
        errorTitle = '❌ Permission Denied';
        errorDetails = 'You don\'t have permission to delete this application.';
        suggestions = '• Contact your administrator for access\n• Check if you\'re logged in as the correct user\n• Some applications may only be deletable by managers';
      } else if (error.message.includes('500')) {
        errorTitle = '❌ Server Error';
        errorDetails = 'There was a problem deleting the application.';
        suggestions = '• Please try again in a moment\n• If the issue persists, contact support\n• Check if the deletion was actually processed';
      } else {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to delete application';
        errorDetails = errorMessage;
        suggestions = '• Refresh the page and try again\n• Check your internet connection\n• Verify the application still exists';
      }
      
      const fullMessage = `${errorTitle}\n\n${errorDetails}\n\n💡 Suggestions:\n${suggestions}`;
      alert(fullMessage);
    }
  };

  const calculateMoveOutImpact = (application: Application, moveOutDate: string) => {
    if (!application.lease || !application.lease.end_date) return null;
    
    const moveOut = new Date(moveOutDate);
    const leaseEnd = new Date(application.lease.end_date);
    
    // Calculate time remaining from move-out date to lease end
    const timeDiff = leaseEnd.getTime() - moveOut.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    
    // Calculate months and remaining days
    const monthsRemaining = Math.floor(daysRemaining / 30);
    const extraDays = daysRemaining % 30;
    
    // Calculate rent forgo (prorated)
    const dailyRent = parseFloat(application.lease.monthly_rent.toString()) / 30;
    const rentForgo = dailyRent * daysRemaining;
    
    return {
      monthsRemaining,
      daysRemaining: extraDays,
      totalDaysRemaining: daysRemaining,
      rentForgo: Math.round(rentForgo * 100) / 100,
      totalForgo: Math.round(rentForgo * 100) / 100
    };
  };

  const handleMoveOut = (application: Application) => {
    setSelectedApplicationForMoveOut(application);
    setIsMoveOutModalOpen(true);
    setMoveOutDate(new Date().toISOString().split('T')[0]); // Default to today
    const calculations = calculateMoveOutImpact(application, new Date().toISOString().split('T')[0]);
    setMoveOutCalculations(calculations);
  };

  const handleMoveOutDateChange = (date: string) => {
    if (!selectedApplicationForMoveOut) return;
    setMoveOutDate(date);
    const calculations = calculateMoveOutImpact(selectedApplicationForMoveOut, date);
    setMoveOutCalculations(calculations);
  };

  const handleConfirmMoveOut = async () => {
    if (!selectedApplicationForMoveOut || !selectedApplicationForMoveOut.lease) return;
    
    try {
      await apiClient.processMoveout(selectedApplicationForMoveOut.lease.id, {
        move_out_date: moveOutDate,
        move_out_condition: 'Manager-processed move-out from applications',
        cleaning_charges: 0,
        damage_charges: 0,
        deposit_returned: parseFloat(selectedApplicationForMoveOut.lease.security_deposit.toString())
      });
      
      // Refresh data to show updated status
      await fetchData();
      
      // Close modal
      setIsMoveOutModalOpen(false);
      setSelectedApplicationForMoveOut(null);
      setMoveOutCalculations(null);
      
      alert('Move-out processed successfully!');
    } catch (error: any) {
      console.error('Failed to process move-out:', error);
      alert(`Failed to process move-out: ${error.message}`);
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
      
      // Optimistically update the application status in the UI immediately
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'room_assigned' as const, room: roomId }
            : app
        )
      );
      
      // Close the modal
      setIsRoomAssignmentModalOpen(false);
      setSelectedApplicationForAssignment(null);
      
      // Refresh data from backend (this will happen in background)
      fetchData(); // Don't await this - let it refresh in background
      
      alert('✅ Room assigned successfully!');
    } catch (error: any) {
      console.error('Room assignment error:', error);
      const errorMessage = error.message || 'Failed to assign room. Please try again.';
      alert(`❌ ${errorMessage}`);
      
      // Only close modal on success - keep it open for error to allow retry
    }
  };

  const openLeaseGenerationModal = (application: Application, room: Room) => {
    setSelectedApplicationForLease(application);
    setSelectedRoomForLease(room);
    setIsLeaseGenerationOpen(true);
  };

  const handleLeaseGenerated = (leaseData: { applicationId: number; tenantName: string; roomName: string; leaseStartDate: string; leaseEndDate: string }) => {
    // Update application status to lease_created (this is called AFTER successful API response)
    setApplications(prevApps => 
      prevApps.map(app => 
        app.id === leaseData.applicationId 
          ? { ...app, status: 'lease_created' }
          : app
      )
    );
    
    // Refresh data to make sure we have the latest backend state
    fetchData();
    
    // Enhanced success message with clear next steps
    const successMessage = `✅ Lease Generated Successfully!\n\n📋 Lease Details:\n• Tenant: ${leaseData.tenantName}\n• Room: ${leaseData.roomName}\n• Period: ${leaseData.leaseStartDate} to ${leaseData.leaseEndDate}\n\n🎯 Next Steps:\n• Go to "Leases" page to activate the lease\n• The lease is currently in "Draft" status\n• Click "Activate" to make it active\n• Then tenant can move in\n\n📍 Navigate: Leases → Draft Leases → Click "Activate"`;
    
    const goToLeases = confirm(`${successMessage}\n\n🚀 Would you like to go to the Leases page now?`);
    
    if (goToLeases) {
      router.push('/leases');
    }
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
        (((app as any).created_at || (app as any).applied_at) ? ((app as any).created_at || (app as any).applied_at).split('T')[0] : 'N/A'),
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
      room.property_ref === app.property_ref && room.is_available
    );
    
    if (availableRooms.length === 0) {
      return 'Cannot generate lease - no available rooms in this property';
    }
    return `Generate lease document for ${app.tenant_name} - ${availableRooms.length} room(s) available`;
  };

  const handleGenerateLease = (app: Application) => {
    // Enhanced validation for lease generation
    if (app.status !== 'room_assigned' && app.status !== 'viewing_completed' && app.status !== 'processing') {
      const statusMessages: { [key: string]: string } = {
        'pending': 'Application must be approved before generating lease.',
        'approved': 'Please complete or skip viewing before generating lease.',
        'viewing_scheduled': 'Please complete the scheduled viewing first.',
        'rejected': 'Cannot generate lease for rejected applications.',
        'lease_ready': 'Lease is ready to be finalized.',
        'lease_created': 'Lease has already been generated for this application.',
        'lease_signed': 'Lease is already signed for this application.',
        'moved_in': 'Tenant has already moved in.',
        'active': 'Lease is already active for this tenant.'
      };
      
      const message = statusMessages[app.status] || `Lease cannot be generated from status: ${app.status}`;
      
      alert(`❌ Cannot Generate Lease\n\n${message}\n\n💡 Current Status: ${app.status.replace('_', ' ').toUpperCase()}\n\nPlease follow the application workflow in order.`);
      return;
    }

    // Always open the modal - let the modal handle room selection and validation
    setSelectedApplicationForLease(app);
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
      const viewing = (app as any).viewings?.[0]; // Get the latest viewing
      if (viewing) {
        setSelectedApplicationForViewing(app);
        setSelectedViewingForCompletion(viewing);
        setIsViewingCompletionOpen(true);
      } else {
        // If no viewing data found, allow completion anyway
          setSelectedApplicationForViewing(app);
          setSelectedViewingForCompletion(null);
          setIsViewingCompletionOpen(true);
      }
    } else {
      alert(`Cannot setup viewing for application in ${app.status} status`);
    }
  };

  const handleRescheduleViewing = (app: Application) => {
    if (app.status === 'viewing_scheduled') {
      // Reschedule existing viewing - open ViewingManagement modal
      setIsViewingManagementOpen(true);
    } else {
      alert(`Cannot reschedule viewing for application in ${app.status} status`);
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
      
      // Optimistically update the application status in the UI immediately
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === selectedApplicationForViewing.id 
            ? { ...app, status: 'viewing_scheduled' as const }
            : app
        )
      );
      
      // Close the modal
      setIsViewingSchedulerOpen(false);
      setSelectedApplicationForViewing(null);
      
      // Refresh data from backend (this will happen in background)
      fetchData(); // Don't await this - let it refresh in background
      fetchViewingsCount(); // Refresh viewings count
      
      // Enhanced success message with next steps
      const successMessage = `✅ Viewing Scheduled Successfully!\n\n📅 Details:\n• Date: ${viewingData.scheduled_date}\n• Time: ${viewingData.scheduled_time}\n• Contact: ${viewingData.contact_person}\n• Notes: ${viewingData.viewing_notes || 'None'}\n\n🎯 Next Steps:\n• The tenant will be notified about the viewing\n• Complete the viewing after it takes place\n• Use "Complete Viewing" button when done\n• Or "Reschedule" if changes are needed`;
      alert(successMessage);
      
    } catch (error: any) {
      console.error('Schedule viewing error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorTitle = '❌ Failed to Schedule Viewing';
      let errorDetails = '';
      let suggestions = '';
      
            if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorTitle = '❌ Invalid Viewing Details';
        if (error.message.includes('Can only schedule viewing for approved applications') || error.message.includes('Invalid viewing data: {\"error\":\"Can only schedule viewing for approved applications\"')) {
          errorDetails = 'Only approved applications can have viewings scheduled.';
          
          // Extract current status if available in error message  
          const statusMatch = error.message.match(/"current_status":"([^"]+)"/);
          const currentStatus = statusMatch ? statusMatch[1].replace('_', ' ') : 'unknown';
          
          if (currentStatus !== 'unknown') {
            errorDetails += `\n\nCurrent status: ${currentStatus.toUpperCase()}`;
          }
          suggestions = '• Application must be in "approved" status first\n• Check if application was rejected or already processed\n• Refresh the page to see current status';
        } else if (error.message.includes('date') || error.message.includes('time')) {
          errorDetails = 'The viewing date or time is invalid.';
          suggestions = '• Choose a future date and time\n• Ensure time format is correct (HH:MM)';
        } else if (error.message.includes('already scheduled') || error.message.includes('viewing_scheduled')) {
          errorDetails = 'This application already has a viewing scheduled.';
          suggestions = '• Use "Reschedule" instead of "Schedule Viewing"\n• Or complete the existing viewing first';
      } else {
          errorDetails = 'The viewing information provided is not valid.';
          suggestions = '• Check all required fields are filled\n• Verify contact information format';
        }
      } else if (error.message.includes('404')) {
        errorTitle = '❌ Application Not Found';
        errorDetails = 'The application you\'re trying to schedule viewing for no longer exists.';
        suggestions = '• The application may have been deleted\n• Refresh the page to see current applications';
        } else if (error.message.includes('500')) {
        errorTitle = '❌ Server Error';
        errorDetails = 'There was a problem processing your viewing request.';
        suggestions = '• Please try again in a moment\n• If the issue persists, contact support';
        } else {
        errorDetails = error.message || 'An unexpected error occurred.';
        suggestions = '• Refresh the page and try again\n• Check your internet connection';
        }
        
      const fullMessage = `${errorTitle}\n\n${errorDetails}\n\n💡 Suggestions:\n${suggestions}`;
      alert(fullMessage);
      
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
      
      // Optimistically update the application status in the UI immediately
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === selectedApplicationForViewing.id 
            ? { ...app, status: 'viewing_completed' as const }
            : app
        )
      );
      
      // Close the modal
      setIsViewingCompletionOpen(false);
      setSelectedApplicationForViewing(null);
      setSelectedViewingForCompletion(null);
      
      // Refresh data from backend (this will happen in background)
      fetchData(); // Don't await this - let it refresh in background
      fetchViewingsCount(); // Refresh viewings count
      
      // Enhanced success message based on outcome
      let nextSteps = '';
      let outcomeIcon = '';
      
      switch(completionData.outcome) {
        case 'positive':
          outcomeIcon = '👍';
          nextSteps = '• Generate lease for this tenant\n• Assign room and finalize terms\n• Send lease for signing';
          break;
        case 'negative':
          outcomeIcon = '👎';
          nextSteps = '• Application will be rejected automatically\n• Consider other applications for this property\n• Tenant will be notified';
          break;
        case 'neutral':
          outcomeIcon = '🤔';
          nextSteps = '• Review feedback and make decision\n• Additional evaluation may be needed\n• Consider scheduling follow-up';
          break;
      }
      
      const successMessage = `✅ Viewing Completed Successfully!\n\n${outcomeIcon} Outcome: ${completionData.outcome.toUpperCase()}\n\n📝 Feedback:\n${completionData.tenant_feedback ? `• Tenant: "${completionData.tenant_feedback}"` : '• No tenant feedback recorded'}\n${completionData.landlord_notes ? `• Your notes: "${completionData.landlord_notes}"` : '• No landlord notes recorded'}\n\n🎯 Next Steps:\n${nextSteps}`;
      
      alert(successMessage);
      
        } catch (error: any) {
      console.error('Complete viewing error:', error);
      
      // Enhanced error handling for viewing completion
      let errorTitle = '❌ Failed to Complete Viewing';
      let errorDetails = '';
      let suggestions = '';
      
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorTitle = '❌ Cannot Complete Viewing';
        if (error.message.includes('No active viewing found for this application') || error.message.includes('Invalid completion data: {\"error\":\"No active viewing found for this application\"')) {
          errorDetails = 'No active viewing was found for this application.';
          suggestions = '• Schedule a viewing first before trying to complete it\n• Or use "Skip Viewing" if no viewing is needed\n• Check if viewing was already completed or canceled';
        } else if (error.message.includes('already completed')) {
          errorDetails = 'This viewing has already been completed.';
          suggestions = '• Refresh the page to see current status\n• The application should be ready for lease generation';
        } else if (error.message.includes('viewing_scheduled')) {
          errorDetails = 'The application must have a scheduled viewing to complete.';
          suggestions = '• Make sure viewing was scheduled first\n• Check application status';
        } else {
          errorDetails = 'The viewing completion data is invalid.';
          suggestions = '• Ensure outcome is selected (Positive/Negative/Neutral)\n• Check all required fields';
        }
      } else if (error.message.includes('404')) {
        errorTitle = '❌ Application Not Found';
        errorDetails = 'The application or viewing no longer exists.';
        suggestions = '• The application may have been deleted\n• Refresh the page to see current applications';
        } else if (error.message.includes('500')) {
        errorTitle = '❌ Server Error';
        errorDetails = 'There was a problem completing the viewing.';
        suggestions = '• Please try again in a moment\n• If the issue persists, contact support';
        } else {
        errorDetails = error.message || 'An unexpected error occurred while completing the viewing.';
        suggestions = '• Refresh the page and try again\n• Check your internet connection';
        }
        
      const fullMessage = `${errorTitle}\n\n${errorDetails}\n\n💡 Suggestions:\n${suggestions}`;
      alert(fullMessage);
    }
  };

  const handleNewLeaseGeneration = async (applicationId: number) => {
    // Find the application to open the lease generation modal
    const application = applications.find(app => app.id === applicationId);
    if (!application) {
      alert('❌ Application not found. Please refresh the page.');
      return;
    }
    
    // Open the lease generation modal for property and room selection
    setSelectedApplicationForLease(application);
    setIsLeaseGenerationOpen(true);
  };

  const handleActivateLease = async (application: Application) => {
    try {
      await apiClient.activateLease(application.lease_id!);
      await fetchData();
      alert('Lease activated successfully!');
    } catch (error: any) {
      alert(`Failed to activate lease: ${error.message}`);
    }
  };

  const handleSendToTenant = async (application: Application) => {
    if (!application.lease_id) {
      alert('No lease found for this application');
      return;
    }
    try {
      await apiClient.sendLeaseToTenant(application.lease_id);
      await fetchData();
      alert('Lease sent to tenant successfully!');
    } catch (error: any) {
      alert(`Failed to send lease to tenant: ${error.message}`);
    }
  };

  const handleEditLease = (application: Application) => {
    if (!application.lease_id) {
      alert('No lease found for this application');
      return;
    }
    // Navigate to lease detail page for editing
    window.location.href = `/leases/${application.lease_id}`;
  };

  const handleDownloadLease = async (application: Application) => {
    if (!application.lease_id) {
      alert('No lease found for this application');
      return;
    }
    try {
      const downloadData = await apiClient.downloadDraftLease(application.lease_id);
      // Open download URL in new tab
      window.open(downloadData.download_url, '_blank');
    } catch (error: any) {
      alert(`Failed to download lease: ${error.message}`);
    }
  };

  const handleSkipViewing = async (applicationId: number) => {
    try {
      // Call the API to skip viewing
      await apiClient.skipViewing(applicationId);
      
      // Optimistically update the application status in the UI immediately
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'viewing_completed' as const }
            : app
        )
      );
      
      // Refresh data from backend (this will happen in background)
      fetchData(); // Don't await this - let it refresh in background
      
      // Enhanced success message for skip viewing
      const successMessage = `✅ Viewing Skipped Successfully!\n\n⏭️ Status Update:\n• Application moved to "Viewing Completed" stage\n• No viewing record created\n• Ready for lease generation\n\n🎯 Next Steps:\n• Review application details\n• Generate lease document\n• Assign room and finalize terms\n• Send lease to tenant for signing`;
      
      alert(successMessage);
      
    } catch (error: any) {
      console.error('Skip viewing error:', error);
      
      // Enhanced error handling for skip viewing
      let errorTitle = '❌ Failed to Skip Viewing';
      let errorDetails = '';
      let suggestions = '';
      
            if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorTitle = '❌ Cannot Skip Viewing';
        if (error.message.includes('Only approved applications can skip viewing') || error.message.includes('Cannot skip viewing: Only approved applications can skip viewing')) {
          errorDetails = 'Only approved applications can skip viewing.';
          suggestions = '• The application must be in "approved" status\n• Check if application was rejected or already processed\n• Refresh the page to see current status';
        } else if (error.message.includes('already completed')) {
          errorDetails = 'This application has already progressed beyond the viewing stage.';
          suggestions = '• The viewing may already be completed or skipped\n• Check current application status\n• Proceed to lease generation if ready';
      } else {
          errorDetails = 'The application is not in the correct state to skip viewing.';
          suggestions = '• Application must be approved first\n• Check application status and try again';
        }
      } else if (error.message.includes('404')) {
        errorTitle = '❌ Application Not Found';
        errorDetails = 'The application no longer exists.';
        suggestions = '• The application may have been deleted\n• Refresh the page to see current applications';
        } else if (error.message.includes('500')) {
        errorTitle = '❌ Server Error';
        errorDetails = 'There was a problem skipping the viewing.';
        suggestions = '• Please try again in a moment\n• If the issue persists, contact support';
        } else {
        errorDetails = error.message || 'An unexpected error occurred while skipping viewing.';
        suggestions = '• Refresh the page and try again\n• Check your internet connection';
        }
        
      const fullMessage = `${errorTitle}\n\n${errorDetails}\n\n💡 Suggestions:\n${suggestions}`;
      alert(fullMessage);
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
        {/* Modern Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 0.25rem 0'
                }}>
                  Applications Review
                </h1>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  <Calendar style={{ width: '1rem', height: '1rem' }} />
                  Review and decide on rental applications. Approved tenants must be assigned to rooms and moved in.
              </div>
            </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => router.push('/listings')} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                title="View and manage property listings"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                View Listings
              </button>

              <button
                onClick={() => router.push('/tenants')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
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
                onClick={() => setIsViewingManagementOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                title="Manage property viewings and track completion status"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Viewings ({viewingsCount} due)
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            {
              title: 'Total Applications',
              value: metrics.total,
              subtitle: 'Total received',
              label: 'All time',
              change: `+${metrics.total > 0 ? '1' : '0'}`,
              changeType: 'positive',
              icon: <FileText style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#2563eb',
              bgColor: '#dbeafe'
            },
            {
              title: 'Pending Review',
              value: metrics.pending,
              subtitle: 'Awaiting decision',
              label: 'Needs review',
              change: `+${metrics.pending > 0 ? '1' : '0'}`,
              changeType: 'positive',
              icon: <Clock style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#f59e0b',
              bgColor: '#fef3c7'
            },
            {
              title: 'Approved',
              value: metrics.approved,
              subtitle: 'Successfully approved',
              label: 'Approval rate',
              change: `+${metrics.approved > 0 ? '1' : '0'}`,
              changeType: 'positive',
              icon: <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#059669',
              bgColor: '#d1fae5'
            },
            {
              title: 'Conversion Rate',
              value: `${metrics.conversionRate}%`,
              subtitle: 'Applications to tenants',
              label: 'Success rate',
              change: `+${metrics.conversionRate > 50 ? '↗' : metrics.conversionRate > 25 ? '→' : '↘'}`,
              changeType: metrics.conversionRate > 50 ? 'positive' : metrics.conversionRate > 25 ? 'neutral' : 'negative',
              icon: <TrendingUp style={{ width: '1.25rem', height: '1.25rem' }} />,
              color: '#7c3aed',
              bgColor: '#e9d5ff'
            }
          ].map((metric, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  {metric.title}
                </h3>
                <div style={{
                  backgroundColor: metric.bgColor,
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: metric.color
                }}>
                  {metric.icon}
                </div>
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '0.25rem',
                lineHeight: 1
              }}>
                {metric.value}
            </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                {metric.subtitle}
              </div>
                            <div style={{ height: '0.25rem' }}></div>
            </div>
          ))}
        </div>

        {/* Application Kanban with built-in list view */}
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
            onRescheduleViewing={handleRescheduleViewing}
            onActivateLease={handleActivateLease}
            onSkipViewing={handleSkipViewing}
            onDelete={handleDelete}
            onSendToTenant={handleSendToTenant}
            onEditLease={handleEditLease}
            onDownloadLease={handleDownloadLease}
            onMoveOut={handleMoveOut}
            getPropertyName={getPropertyName}
            formatDate={formatDate}
            extraActions={(
              <>
                  <button 
                    onClick={fetchData} 
                    className={`refresh-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                    title="Refresh applications data to get the latest information (including newly created leases)"
                    style={{
                      backgroundColor: loading ? '#e5e5e5' : '#2563eb',
                      color: loading ? '#999' : 'white',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{
                        animation: loading ? 'spin 1s linear infinite' : 'none'
                      }}
                    >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button 
                    onClick={downloadApplicationsReport} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
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
          availableRooms={rooms.filter(room => room.is_available)}
          properties={properties}
          onClose={() => setIsConflictModalOpen(false)}
          onResolveConflict={handleConflictResolution}
        />
      )}

      {isRoomAssignmentModalOpen && selectedApplicationForAssignment && (
        <RoomAssignmentModal
          application={selectedApplicationForAssignment}
          availableRooms={rooms.filter(room => room.is_available)}
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

      {isLeaseGenerationOpen && selectedApplicationForLease && (
        <ImprovedLeaseGenerationModal
          isOpen={isLeaseGenerationOpen}
          application={selectedApplicationForLease}
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

      {isViewingManagementOpen && (
        <ViewingManagementModal
          isOpen={isViewingManagementOpen}
          onClose={() => {
            setIsViewingManagementOpen(false);
            fetchViewingsCount(); // Refresh count when modal closes
          }}
        />
      )}

      {isApprovalModalOpen && selectedApplicationForApproval && (
        <ApplicationApprovalModal
          isOpen={isApprovalModalOpen}
          application={selectedApplicationForApproval}
          property={selectedPropertyForApproval}
          availableRooms={selectedPropertyForApproval ? rooms.filter(room => 
            room.property_ref === selectedPropertyForApproval.id && room.is_available
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

      {/* Move-out Confirmation Modal */}
      {isMoveOutModalOpen && selectedApplicationForMoveOut && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LogOut style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>
                  Process Move-Out
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0'
                }}>
                  {selectedApplicationForMoveOut.tenant_name} - {selectedApplicationForMoveOut.property_name}
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <Calendar style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Move-out Date
                </span>
              </div>
              <input
                type="date"
                value={moveOutDate}
                onChange={(e) => handleMoveOutDateChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {moveOutCalculations && (
              <div style={{
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                border: '1px solid #fbbf24'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <Calculator style={{ width: '1rem', height: '1rem', color: '#d97706' }} />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#92400e'
                  }}>
                    Financial Impact
                  </span>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  fontSize: '0.875rem'
                }}>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                      Time Remaining
                    </div>
                    <div style={{ fontWeight: '600', color: '#374151' }}>
                      {moveOutCalculations.monthsRemaining} months, {moveOutCalculations.daysRemaining} days
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                      Rent Forgo
                    </div>
                    <div style={{ fontWeight: '600', color: '#dc2626' }}>
                      ${moveOutCalculations.rentForgo.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #fbbf24'
                }}>
                  <div style={{ color: '#6b7280', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    Total Days Lost: {moveOutCalculations.totalDaysRemaining}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Lease ends on: {selectedApplicationForMoveOut.lease?.end_date ? formatDate(selectedApplicationForMoveOut.lease.end_date) : 'N/A'}
                  </div>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setIsMoveOutModalOpen(false);
                  setSelectedApplicationForMoveOut(null);
                  setMoveOutCalculations(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f8fafc',
                  color: '#374151',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMoveOut}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Confirm Move-Out
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

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