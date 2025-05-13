'use client';

import Link from 'next/link';

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Guide</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
            
            <p className="mb-4">
              Memory Vista helps universities create and maintain digital memorials for community members.
              This guide will help you understand how to create and manage memorials, as well as the permissions system.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Key Features</h3>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Create beautiful digital memorials to honor individuals</li>
              <li>Collaborate with family members on memorial creation</li>
              <li>Share memorials with the community</li>
              <li>Maintain a collection of memorials for your university</li>
            </ul>
            
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">User Types</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg mb-6">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      User Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Permissions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      Public Visitor
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Anyone who visits published memorials
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      <ul className="list-disc pl-5">
                        <li>View published memorials</li>
                        <li>No login required</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      University Administrator
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Manages university memorials
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      <ul className="list-disc pl-5">
                        <li>Create memorials directly</li>
                        <li>Send invitations to others to create memorials</li>
                        <li>Approve & publish memorials</li>
                        <li>Edit any memorial in their university</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      Memorial Creator
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Creates memorials via invitation
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      <ul className="list-disc pl-5">
                        <li>Create memorials through invitations</li>
                        <li>Edit their own memorials</li>
                        <li>Submit memorials for approval</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Creating Memorials</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">As a University Administrator</h3>
            <p className="mb-4">
              University administrators can create memorials directly or invite family members to create them.
            </p>
            
            <ol className="list-decimal pl-5 space-y-4 mb-6">
              <li>
                <strong>Direct Creation:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Log in to your account</li>
                  <li>Go to your University Dashboard</li>
                  <li>Click "Create Memorial" and select "Create Memorial Yourself"</li>
                  <li>Fill out the memorial information through the guided process</li>
                </ul>
              </li>
              <li>
                <strong>Invite Someone to Create:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Log in to your account</li>
                  <li>Go to your University Dashboard</li>
                  <li>Click "Create Memorial" and select "Invite Someone to Create Memorial"</li>
                  <li>Enter an email address (optional) and create an invitation</li>
                  <li>Share the generated link with the family member</li>
                </ul>
              </li>
            </ol>
            
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">As an Invited Creator</h3>
            <p className="mb-4">
              If you've received an invitation to create a memorial, follow these steps:
            </p>
            
            <ol className="list-decimal pl-5 space-y-4 mb-6">
              <li>
                <strong>Accept the Invitation:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Click the invitation link you received</li>
                  <li>Sign in or create an account if prompted</li>
                  <li>Click "Accept Invitation"</li>
                </ul>
              </li>
              <li>
                <strong>Create the Memorial:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>After accepting, you'll be guided through the memorial creation process</li>
                  <li>Fill out the basic information, life story, and add photos</li>
                  <li>Submit the memorial for university approval</li>
                </ul>
              </li>
              <li>
                <strong>Track Status:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>You can view the status of your memorial in your dashboard</li>
                  <li>Once approved by the university, it will be published and visible to everyone</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Permission System</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Memorial Access Levels</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg mb-6">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Access Level
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Who Has It
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Capabilities
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      View Access
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Everyone (for published memorials)
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Can view all memorial content
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      Edit Access
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Memorial creator and university administrators
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Can modify memorial content
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      Publish Access
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      University administrators only
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-500">
                      Can approve and publish memorials
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Need Help?</h3>
            <p>
              If you need assistance or have questions about using Memory Vista, please contact your university administrator
              or reach out to our support team at <a href="mailto:support@memoryvista.com" className="text-indigo-600 hover:text-indigo-900">support@memoryvista.com</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 