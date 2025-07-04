<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function index()
    {
        return Inertia::render('locations', [
            'locations' => Location::latest()->get()->map(function ($location) {
                return [
                    'id'         => $location->id,
                    'name'       => $location->name,
                    'latitude'   => (float)$location->latitude,
                    'longitude'  => (float)$location->longitude,
                    'address'    => $location->address,
                    'created_at' => $location->created_at->format('Y-m-d H:i:s'),
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address'   => 'nullable|string|max:500',
        ]);

        $loc = Location::create($data);

        return response()->json([
            'success'  => true,
            'location' => [
                'id'         => $loc->id,
                'name'       => $loc->name,
                'latitude'   => (float)$loc->latitude,
                'longitude'  => (float)$loc->longitude,
                'address'    => $loc->address,
                'created_at' => $loc->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    public function update(Request $request, Location $location)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address'   => 'nullable|string|max:500',
        ]);

        $location->update($data);

        return response()->json([
            'success'  => true,
            'location' => [
                'id'         => $location->id,
                'name'       => $location->name,
                'latitude'   => (float)$location->latitude,
                'longitude'  => (float)$location->longitude,
                'address'    => $location->address,
                'created_at' => $location->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    public function destroy(Location $location)
    {
        try {
            // Check if location is being used by any classes
            $classCount = $location->classes()->count();

            if ($classCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete location '{$location->name}' because it is currently being used by {$classCount} " .
                        ($classCount === 1 ? 'class' : 'classes') . ". Please reassign or delete those classes first."
                ], 422);
            }

            // Check if location is being used by any other related models
            // Add more relationship checks as needed

            $location->delete();

            return response()->json([
                'success' => true,
                'message' => 'Location deleted successfully.'
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle foreign key constraint violations
            if ($e->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete location '{$location->name}' because it is being referenced by other records. Please remove those references first."
                ], 422);
            }

            Log::error('Location deletion failed', [
                'location_id' => $location->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete location. Please try again.'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Unexpected error during location deletion', [
                'location_id' => $location->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred. Please try again.'
            ], 500);
        }
    }
}
