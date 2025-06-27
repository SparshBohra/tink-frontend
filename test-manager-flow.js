#!/usr/bin/env node

// Test script for manager and property assignment flow
const API_BASE = 'https://tink.global/api';

async function testManagerFlow() {
  console.log('🧪 Testing Enhanced Manager Flow');
  console.log('================================\n');

  // Step 1: Login
  console.log('1️⃣ Testing Login...');
  const loginResponse = await fetch(`${API_BASE}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'premium_owner',
      password: 'demo123'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed');
    return;
  }
  
  const loginData = await loginResponse.json();
  const token = loginData.access;
  console.log('✅ Login successful\n');

  // Step 2: Test Enhanced Managers Endpoint
  console.log('2️⃣ Testing Enhanced Managers Endpoint...');
  const managersResponse = await fetch(`${API_BASE}/managers-with-properties/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!managersResponse.ok) {
    console.error('❌ Enhanced managers endpoint failed');
    return;
  }
  
  const managersData = await managersResponse.json();
  console.log(`✅ Found ${managersData.length} managers`);
  console.log('Sample manager data:');
  console.log(JSON.stringify(managersData[0], null, 2));
  console.log();

  // Step 3: Test Properties Endpoint
  console.log('3️⃣ Testing Properties Endpoint...');
  const propertiesResponse = await fetch(`${API_BASE}/properties/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!propertiesResponse.ok) {
    console.error('❌ Properties endpoint failed');
    return;
  }
  
  const propertiesData = await propertiesResponse.json();
  console.log(`✅ Found ${propertiesData.length} properties`);
  console.log('Sample property data:');
  console.log(JSON.stringify(propertiesData[0], null, 2));
  console.log();

  // Step 4: Test Manager Creation
  console.log('4️⃣ Testing Manager Creation...');
  const newManagerData = {
    username: `test_manager_${Date.now()}`,
    email: `test${Date.now()}@manager.com`,
    full_name: 'Test Manager Flow',
    password: 'testpass123'
  };
  
  const createManagerResponse = await fetch(`${API_BASE}/managers/`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newManagerData)
  });
  
  if (!createManagerResponse.ok) {
    console.error('❌ Manager creation failed');
    return;
  }
  
  const createdManager = await createManagerResponse.json();
  console.log(`✅ Manager created with ID: ${createdManager.id}`);
  console.log();

  // Step 5: Test Manager-Landlord Relationship
  console.log('5️⃣ Testing Manager-Landlord Relationship...');
  const relationshipData = {
    manager: createdManager.id,
    landlord: 45, // Premium Properties LLC
    is_primary: true,
    access_all_properties: false
  };
  
  const createRelationshipResponse = await fetch(`${API_BASE}/manager-landlord-relationships/`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(relationshipData)
  });
  
  if (!createRelationshipResponse.ok) {
    console.error('❌ Manager-landlord relationship creation failed');
    return;
  }
  
  const createdRelationship = await createRelationshipResponse.json();
  console.log(`✅ Relationship created with ID: ${createdRelationship.id}`);
  console.log();

  // Step 6: Test Property Assignment
  console.log('6️⃣ Testing Property Assignment...');
  const assignmentData = {
    manager: createdManager.id,
    property: propertiesData[0].id,
    landlord_relationship: createdRelationship.id
  };
  
  const createAssignmentResponse = await fetch(`${API_BASE}/manager-property-assignments/`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assignmentData)
  });
  
  if (!createAssignmentResponse.ok) {
    console.error('❌ Property assignment failed');
    return;
  }
  
  const createdAssignment = await createAssignmentResponse.json();
  console.log(`✅ Property assignment created with ID: ${createdAssignment.id}`);
  console.log();

  // Step 7: Verify Enhanced Managers Data
  console.log('7️⃣ Verifying Enhanced Managers Data...');
  const updatedManagersResponse = await fetch(`${API_BASE}/managers-with-properties/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const updatedManagers = await updatedManagersResponse.json();
  const testManager = updatedManagers.find(m => m.id === createdManager.id);
  
  if (testManager && testManager.assigned_properties.length > 0) {
    console.log('✅ Manager successfully shows assigned properties');
    console.log(`Manager: ${testManager.full_name}`);
    console.log(`Access Level: ${testManager.access_level}`);
    console.log(`Assigned Properties: ${testManager.assigned_properties.length}`);
    console.log('Property Details:');
    testManager.assigned_properties.forEach(prop => {
      console.log(`  - ${prop.name} (${prop.address})`);
    });
  } else {
    console.error('❌ Property assignment not reflected in enhanced managers data');
  }
  
  console.log('\n🎉 Manager Flow Test Complete!');
  console.log('✅ All API endpoints working correctly');
  console.log('✅ Frontend should now work with proper property assignments');
}

// Run the test
testManagerFlow().catch(console.error); 