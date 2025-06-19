<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
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
        $location->delete();

        return response()->json(['success' => true]);
    }
}
